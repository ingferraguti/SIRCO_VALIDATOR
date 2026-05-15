import { promises as fs } from "fs";
import path from "path";

const inputDir = path.join(process.cwd(), "data", "input");

export async function readInputFile(fileName: string): Promise<{ found: boolean; content: string }> {
  try {
    const content = await fs.readFile(path.join(inputDir, fileName), "utf-8");
    return { found: true, content };
  } catch {
    return { found: false, content: "" };
  }
}
