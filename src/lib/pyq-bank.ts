import { promises as fs } from "node:fs";
import path from "node:path";
import type { PyqQuestion } from "@/lib/types";

const BANK_PATH = path.join(process.cwd(), "data", "pyq-bank.json");

export async function readPyqBank(): Promise<PyqQuestion[]> {
  try {
    const raw = await fs.readFile(BANK_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as PyqQuestion[];
  } catch {
    return [];
  }
}

export async function writePyqBank(questions: PyqQuestion[]) {
  await fs.mkdir(path.dirname(BANK_PATH), { recursive: true });
  await fs.writeFile(BANK_PATH, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
}

