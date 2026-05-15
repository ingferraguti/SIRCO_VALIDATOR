import { promises as fs } from "fs";
import path from "path";

export const getInputDir = (): string => process.env.SIRCO_INPUT_DIR || path.join(process.cwd(), "data", "input");

export async function readInputFile(fileName: string): Promise<{ found: boolean; content: string }> {
  try {
    const content = await fs.readFile(path.join(getInputDir(), fileName), "utf-8");
    return { found: true, content };
  } catch {
    return { found: false, content: "" };
  }
}
