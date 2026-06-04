import { promises as fs } from "fs";
import path from "path";
import { getOutputDir } from "./file-reader";
import { ChangeLogEntry, ParsedRecord, SircoTable, TableDefinition } from "./types";

export function buildExportContent(records: readonly ParsedRecord[], definition: TableDefinition): string {
  for (const record of records) if (record.currentRecord.length !== definition.recordLength) throw new Error(`Record ${record.id} con lunghezza ${record.currentRecord.length}, attesa ${definition.recordLength}`);
  return `${records.map((record) => record.currentRecord).join("\r\n")}\r\n`;
}

export async function exportCorrectedFiles(files: Record<SircoTable, string>, records: Record<SircoTable, ParsedRecord[]>, definitions: Record<SircoTable, TableDefinition>, changeLog: readonly ChangeLogEntry[], outputDir = getOutputDir()): Promise<string[]> {
  await fs.mkdir(outputDir, { recursive: true });
  const written: string[] = [];
  for (const [table, fileName] of Object.entries(files) as [SircoTable, string][]) {
    const target = path.join(outputDir, path.basename(fileName));
    await fs.writeFile(target, buildExportContent(records[table], definitions[table]), "utf-8");
    written.push(target);
  }
  const logPath = path.join(outputDir, "sirco-change-log.json");
  await fs.writeFile(logPath, JSON.stringify(changeLog, null, 2), "utf-8");
  written.push(logPath);
  return written;
}
