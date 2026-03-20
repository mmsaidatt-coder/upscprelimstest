# PYQ ingest agent (PDF/PNG → questions → app)

This folder contains a small Python CLI that:

1) Runs OCR on your PDF (Document AI) or images (Vision API key)
2) Uses Gemini to convert OCR text into structured UPSC-style MCQs
3) Appends the result into `data/pyq-bank.json`, which powers `/app/pyq`

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/pyq_agent/requirements.txt
```

## Required env vars

- `GEMINI_API_KEY` — Gemini API key
- `GEMINI_MODEL` — optional (defaults to `gemini-3-flash-preview`)

### For PDFs (Document AI OCR)

Document AI uses Google Cloud authentication (service account / ADC), not an API key.

- `GOOGLE_APPLICATION_CREDENTIALS` — path to your service account JSON
- `GOOGLE_CLOUD_PROJECT` — your GCP project id
- `GOOGLE_CLOUD_LOCATION` — optional (default: `us`)
- `DOCUMENTAI_PROCESSOR_ID` — Document OCR processor id

### For images (Vision OCR)

- `GOOGLE_VISION_API_KEY` — Cloud Vision API key (used via REST)

## Usage

### Import a PDF (Document AI → Gemini → bank)

```bash
python3 scripts/pyq_agent/ingest.py --input /path/to/pyq.pdf --year 2023 --topics "Polity, Parliament"
```

### Import PNG/JPG pages (Vision → Gemini → bank)

```bash
python3 scripts/pyq_agent/ingest.py --input page1.png page2.png --year 2022 --topics "Environment"
```

Open the app and browse: `http://localhost:3000/app/pyq`

