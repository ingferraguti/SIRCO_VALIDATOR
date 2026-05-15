import { NextResponse } from "next/server";
import { tableDefinitions } from "@/lib/sirco/definitions";
import { parseFixedLengthContent } from "@/lib/sirco/parser";
import { validateTable } from "@/lib/sirco/validator";
import { validateRelations } from "@/lib/sirco/relational-validator";
import { getInputDir, readInputFile } from "@/lib/sirco/file-reader";
import { SircoTable, TableResult, ValidationIssue } from "@/lib/sirco/types";

export async function GET() {
  const tables = {} as Record<SircoTable, TableResult>;
  const recordsMap = {} as Record<SircoTable, ReturnType<typeof parseFixedLengthContent>>;
  const globalIssues: ValidationIssue[] = [];

  for (const table of Object.keys(tableDefinitions) as SircoTable[]) {
    const def = tableDefinitions[table];
    const file = await readInputFile(def.fileName);
    if (!file.found) {
      const missingSeverity = table === "B" ? "ERROR" : "WARNING";
      tables[table] = { records: [], issues: [{ severity: missingSeverity, table, logicalName: def.logicalName, line: 0, message: `File mancante: ${def.fileName}` }], fileStatus: "MISSING", definition: def };
      recordsMap[table] = [];
      continue;
    }
    const records = parseFixedLengthContent(file.content, def);
    const issues = validateTable(records, def);
    tables[table] = { definition: def, records, issues, fileStatus: "FOUND" };
    recordsMap[table] = records;
  }

  globalIssues.push(...validateRelations(recordsMap));
  const allIssues = [...Object.values(tables).flatMap((t) => t.issues), ...globalIssues];
  const totalErrors = allIssues.filter((i) => i.severity === "ERROR").length;
  const totalWarnings = allIssues.filter((i) => i.severity === "WARNING").length;
  const summary = {
    inputDir: getInputDir(),
    expectedFiles: Object.keys(tableDefinitions).length,
    filesFound: Object.values(tables).filter((t) => t.fileStatus === "FOUND").length,
    filesMissing: Object.values(tables).filter((t) => t.fileStatus === "MISSING").length,
    totalRecords: Object.values(tables).reduce((acc, t) => acc + t.records.length, 0),
    totalErrors,
    totalWarnings,
    validationStatus: totalErrors > 0 ? "ERRORI PRESENTI" : totalWarnings > 0 ? "WARNING" : "OK",
  };

  return NextResponse.json({ tables, globalIssues, summary });
}
