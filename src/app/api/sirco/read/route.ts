import { NextResponse } from "next/server";
import { tableDefinitions } from "@/lib/sirco/definitions";
import { parseFixedLengthContent } from "@/lib/sirco/parser";
import { validateTable } from "@/lib/sirco/validator";
import { validateRelations } from "@/lib/sirco/relational-validator";
import { readInputFile } from "@/lib/sirco/file-reader";
import { SircoTable, TableResult, ValidationIssue } from "@/lib/sirco/types";

export async function GET() {
  const tables = {} as Record<SircoTable, TableResult>;
  const recordsMap = {} as Record<SircoTable, ReturnType<typeof parseFixedLengthContent>>;
  const globalIssues: ValidationIssue[] = [];

  for (const table of Object.keys(tableDefinitions) as SircoTable[]) {
    const def = tableDefinitions[table];
    const file = await readInputFile(def.fileName);
    if (!file.found) {
      tables[table] = { records: [], issues: [{ severity: "WARNING", table, line: 0, message: "file non presente" }], fileStatus: "MISSING" };
      recordsMap[table] = [];
      continue;
    }
    const records = parseFixedLengthContent(file.content, def);
    const issues = validateTable(records, def);
    tables[table] = { records, issues, fileStatus: "FOUND" };
    recordsMap[table] = records;
  }

  globalIssues.push(...validateRelations(recordsMap));
  const allIssues = [...Object.values(tables).flatMap((t) => t.issues), ...globalIssues];
  const summary = {
    filesFound: Object.values(tables).filter((t) => t.fileStatus === "FOUND").length,
    records: Object.fromEntries((Object.keys(tables) as SircoTable[]).map((t) => [t, tables[t].records.length])),
    errors: allIssues.filter((i) => i.severity === "ERROR").length,
    warnings: allIssues.filter((i) => i.severity === "WARNING").length,
  };

  return NextResponse.json({ tables, globalIssues, summary });
}
