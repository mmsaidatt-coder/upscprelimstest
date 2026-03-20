from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import requests
from google import genai
from pydantic import BaseModel, Field


SUBJECTS = (
    "Polity",
    "History",
    "Economy",
    "Geography",
    "Environment",
    "Science",
    "Current Affairs",
    "CSAT",
)


class ExtractedOption(BaseModel):
    id: Literal["A", "B", "C", "D"]
    text: str = Field(min_length=1)


class ExtractedQuestion(BaseModel):
    question_number: int | None = None
    subject: Literal[
        "Polity",
        "History",
        "Economy",
        "Geography",
        "Environment",
        "Science",
        "Current Affairs",
        "CSAT",
    ]
    prompt: str = Field(min_length=8)
    context_lines: list[str] | None = None
    options: list[ExtractedOption] = Field(min_length=4, max_length=4)
    correct_option_id: Literal["A", "B", "C", "D"] | None = None
    topics: list[str] | None = None
    explanation: str | None = None
    takeaway: str | None = None


class ExtractedQuestionsResponse(BaseModel):
    questions: list[ExtractedQuestion]


@dataclass(frozen=True)
class OcrPage:
    label: str
    text: str


def _read_file_bytes(path: Path) -> bytes:
    try:
        return path.read_bytes()
    except FileNotFoundError:
        raise SystemExit(f"Input not found: {path}")


def ocr_image_with_vision_api_key(image_path: Path, api_key: str) -> str:
    content = _read_file_bytes(image_path)
    payload = {
        "requests": [
            {
                "image": {"content": base64.b64encode(content).decode("ascii")},
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
            }
        ]
    }

    response = requests.post(
        f"https://vision.googleapis.com/v1/images:annotate?key={api_key}",
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()
    try:
        return data["responses"][0].get("fullTextAnnotation", {}).get("text", "") or ""
    except (KeyError, IndexError, TypeError):
        return ""


def ocr_pdf_with_document_ai(pdf_path: Path) -> list[OcrPage]:
    try:
        from google.cloud import documentai_v1 as documentai
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: google-cloud-documentai. Install: pip install -r scripts/pyq_agent/requirements.txt"
        ) from exc

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "").strip()
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "").strip() or "us"
    processor_id = os.environ.get("DOCUMENTAI_PROCESSOR_ID", "").strip()

    if not project_id or not processor_id:
        raise SystemExit(
            "Document AI OCR requires env vars GOOGLE_CLOUD_PROJECT and DOCUMENTAI_PROCESSOR_ID "
            "(and optionally GOOGLE_CLOUD_LOCATION)."
        )

    client = documentai.DocumentProcessorServiceClient()
    name = client.processor_path(project_id, location, processor_id)

    raw_document = documentai.RawDocument(
        content=_read_file_bytes(pdf_path), mime_type="application/pdf"
    )
    request = documentai.ProcessRequest(name=name, raw_document=raw_document)
    result = client.process_document(request=request)
    document = result.document

    if not document.text:
        return []

    def anchor_to_text(anchor: documentai.Document.TextAnchor) -> str:
        segments = anchor.text_segments or []
        parts: list[str] = []
        for segment in segments:
            start = int(segment.start_index) if segment.start_index else 0
            end = int(segment.end_index) if segment.end_index else start
            if end <= start:
                continue
            parts.append(document.text[start:end])
        return "".join(parts)

    pages: list[OcrPage] = []
    for index, page in enumerate(document.pages):
        page_text = anchor_to_text(page.layout.text_anchor) if page.layout else ""
        label = f"{pdf_path.name}#page={index + 1}"
        if page_text.strip():
            pages.append(OcrPage(label=label, text=page_text))

    return pages


def build_extraction_prompt(*, year: int, global_topics: list[str], ocr_page: OcrPage) -> str:
    topics_hint = ", ".join(global_topics) if global_topics else "None"
    return f"""
You are extracting UPSC Prelims multiple-choice questions from OCR text.

Return JSON that matches the provided schema exactly.

Rules:
- Extract only actual questions. Ignore headers, footers, page numbers, watermarks, instructions, etc.
- Each question MUST have exactly 4 options with ids A, B, C, D.
- Put multi-statement blocks (like '1. ... 2. ...') into context_lines, and keep prompt as the question sentence.
- correct_option_id MUST be null unless the correct answer is explicitly present in the OCR text.
- subject MUST be one of: {", ".join(SUBJECTS)}.
- topics: 0-5 short tags. Use global topics as hints: {topics_hint}.
- Preserve the question's meaning. Do not invent facts.

Metadata:
- year: {year}
- source: {ocr_page.label}

OCR TEXT:
{ocr_page.text}
""".strip()


def extract_questions_with_gemini(
    *, client: genai.Client, model: str, prompt: str
) -> ExtractedQuestionsResponse:
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": ExtractedQuestionsResponse.model_json_schema(),
        },
    )
    if not response.text:
        return ExtractedQuestionsResponse(questions=[])
    return ExtractedQuestionsResponse.model_validate_json(response.text)


def normalize_topics(global_topics: list[str], extracted_topics: list[str] | None) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []

    for topic in (global_topics or []) + (extracted_topics or []):
        cleaned = (topic or "").strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)

    return result


def stable_question_id(year: int, question_number: int | None, prompt: str, options: list[ExtractedOption]) -> str:
    if question_number is not None and question_number > 0:
        return f"pyq-{year}-{question_number}"

    fingerprint = json.dumps(
        {
            "year": year,
            "prompt": prompt.strip(),
            "options": [{opt.id: opt.text.strip()} for opt in options],
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    digest = hashlib.sha1(fingerprint.encode("utf-8")).hexdigest()[:12]
    return f"pyq-{year}-h{digest}"


def upsert_into_bank(*, bank_path: Path, new_rows: list[dict], overwrite: bool) -> tuple[int, int]:
    existing: list[dict]
    if bank_path.exists():
        existing = json.loads(bank_path.read_text(encoding="utf-8") or "[]")
        if not isinstance(existing, list):
            existing = []
    else:
        existing = []

    by_id: dict[str, dict] = {}
    for row in existing:
        if isinstance(row, dict) and isinstance(row.get("id"), str):
            by_id[row["id"]] = row

    inserted = 0
    skipped = 0
    for row in new_rows:
        row_id = row.get("id")
        if not isinstance(row_id, str):
            continue
        if row_id in by_id and not overwrite:
            skipped += 1
            continue
        if row_id in by_id and overwrite:
            by_id[row_id] = {**by_id[row_id], **row}
        else:
            by_id[row_id] = row
            inserted += 1

    merged = list(by_id.values())
    merged.sort(key=lambda item: (item.get("year", 0), item.get("id", "")))

    bank_path.parent.mkdir(parents=True, exist_ok=True)
    bank_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return inserted, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract UPSC PYQs from PDF/PNG and append into data/pyq-bank.json")
    parser.add_argument("--input", nargs="+", required=True, help="PDF file(s) or image file(s)")
    parser.add_argument("--year", type=int, required=True, help="Question year (e.g., 2023)")
    parser.add_argument("--topics", default="", help="Comma-separated topics/tags to apply to every extracted question")
    parser.add_argument(
        "--out",
        default=str(Path("data") / "pyq-bank.json"),
        help="Output bank JSON path (default: data/pyq-bank.json)",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview"),
        help="Gemini model name (default: env GEMINI_MODEL or gemini-3-flash-preview)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing questions with the same id",
    )
    parser.add_argument(
        "--vision-api-key-env",
        default="GOOGLE_VISION_API_KEY",
        help="Env var name for Vision API key (default: GOOGLE_VISION_API_KEY)",
    )

    args = parser.parse_args()

    year: int = args.year
    global_topics = [topic.strip() for topic in args.topics.split(",") if topic.strip()]
    bank_path = Path(args.out)
    model = args.model

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Missing env var GEMINI_API_KEY (Gemini API key).")

    client = genai.Client(api_key=api_key)

    ocr_pages: list[OcrPage] = []
    for raw_input in args.input:
        input_path = Path(raw_input).expanduser()
        if input_path.suffix.lower() == ".pdf":
            ocr_pages.extend(ocr_pdf_with_document_ai(input_path))
        else:
            vision_api_key = os.environ.get(args.vision_api_key_env, "").strip()
            if not vision_api_key:
                raise SystemExit(
                    f"Image OCR requires a Vision API key in env var {args.vision_api_key_env} "
                    "(or switch to PDF + Document AI)."
                )
            text = ocr_image_with_vision_api_key(input_path, vision_api_key)
            if text.strip():
                ocr_pages.append(OcrPage(label=input_path.name, text=text))

    if not ocr_pages:
        raise SystemExit("No OCR text extracted. Check credentials, processor config, and input quality.")

    all_new_rows: list[dict] = []
    for page in ocr_pages:
        prompt = build_extraction_prompt(year=year, global_topics=global_topics, ocr_page=page)
        extracted = extract_questions_with_gemini(client=client, model=model, prompt=prompt)

        for item in extracted.questions:
            question_id = stable_question_id(
                year, item.question_number, item.prompt, item.options
            )
            topics = normalize_topics(global_topics, item.topics)
            marks = 2.5 if item.subject == "CSAT" else 2
            negative_marks = 0.83 if item.subject == "CSAT" else 0.67
            all_new_rows.append(
                {
                    "id": question_id,
                    "year": year,
                    "topics": topics,
                    "sourceLabel": page.label,
                    "subject": item.subject,
                    "difficulty": "Moderate",
                    "prompt": item.prompt.strip(),
                    "contextLines": [line.strip() for line in (item.context_lines or []) if line.strip()] or None,
                    "options": [opt.model_dump() for opt in item.options],
                    "correctOptionId": item.correct_option_id,
                    "explanation": (item.explanation or "").strip() or None,
                    "takeaway": (item.takeaway or "").strip() or None,
                    "marks": marks,
                    "negativeMarks": negative_marks,
                }
            )

    inserted, skipped = upsert_into_bank(
        bank_path=bank_path, new_rows=all_new_rows, overwrite=bool(args.overwrite)
    )
    print(
        f"Done. Extracted={len(all_new_rows)} Inserted={inserted} Skipped(duplicate)={skipped} Bank={bank_path}"
    )


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        raise SystemExit(130)

