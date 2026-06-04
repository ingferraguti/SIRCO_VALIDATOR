import { promises as fs } from "fs";
import path from "path";
import { tableDefinitions } from "./definitions";
import { SircoTable } from "./types";

export const getInputDir = (): string => process.env.SIRCO_INPUT_DIR || path.join(process.cwd(), "data", "input");
export const getOutputDir = (): string => process.env.SIRCO_OUTPUT_DIR || path.join(process.cwd(), "data", "output");
export const getDomainDir = (): string => path.join(process.cwd(), "data", "domains");

type DiscoveryOk = { status: "FOUND"; table: SircoTable; fileName: string; filePath: string };
type DiscoveryMissing = { status: "MISSING"; table: SircoTable; message: string };
type DiscoveryConfigError = { status: "CONFIG_ERROR"; table: SircoTable; files: string[]; message: string };
export type FileDiscoveryResult = DiscoveryOk | DiscoveryMissing | DiscoveryConfigError;

const patternToRegex = (pattern: string): RegExp => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`);

export async function discoverInputFiles(inputDir = getInputDir()): Promise<Record<SircoTable, FileDiscoveryResult>> {
  let names: string[] = [];
  try { names = await fs.readdir(inputDir); } catch { names = []; }
  const result = {} as Record<SircoTable, FileDiscoveryResult>;
  for (const [table, definition] of Object.entries(tableDefinitions) as [SircoTable, typeof tableDefinitions[SircoTable]][]) {
    const matches = names.filter((name) => patternToRegex(definition.filePattern).test(name)).sort();
    if (matches.length === 1) result[table] = { status: "FOUND", table, fileName: matches[0], filePath: path.join(inputDir, matches[0]) };
    else if (matches.length === 0) result[table] = { status: "MISSING", table, message: `Nessun file trovato per pattern ${definition.filePattern} in ${inputDir}` };
    else result[table] = { status: "CONFIG_ERROR", table, files: matches, message: `Trovati più file per pattern ${definition.filePattern}: ${matches.join(", ")}` };
  }
  return result;
}

export async function readInputFile(fileName: string): Promise<{ found: boolean; content: string }> {
  try { return { found: true, content: await fs.readFile(path.join(getInputDir(), fileName), "utf-8") }; }
  catch { return { found: false, content: "" }; }
}

export async function readDiscoveredFile(result: FileDiscoveryResult): Promise<string> {
  if (result.status !== "FOUND") return "";
  return fs.readFile(result.filePath, "utf-8");
}

export async function loadExternalDomains(domainDir = getDomainDir()): Promise<Record<string, readonly string[]>> {
  const domains: Record<string, readonly string[]> = {};
  const files = ["aziende", "strutture-sirco", "regioni", "comuni", "diagnosi", "procedure"];
  await Promise.all(files.map(async (code) => {
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(path.join(domainDir, `${code}.json`), "utf-8"));
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) domains[code] = parsed;
    } catch {}
  }));
  return domains;
}
