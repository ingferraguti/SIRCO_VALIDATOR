import { NextResponse } from "next/server";
import { tableDefinitions } from "@/lib/sirco/definitions";
import { parseFixedLengthContent } from "@/lib/sirco/parser";
import { validateTable } from "@/lib/sirco/validator";
import { validateRelationsWithoutAnagrafica } from "@/lib/sirco/relational-validator";
import { getInputDir, readInputFile } from "@/lib/sirco/file-reader";
import { SircoTable, TableResult, ValidationIssue } from "@/lib/sirco/types";

export async function GET() {
  const tableKeys = Object.keys(tableDefinitions) as SircoTable[];
  const tables = {} as Record<SircoTable, TableResult>;
  const recordsMap = {} as Record<SircoTable, ReturnType<typeof parseFixedLengthContent>>;

  for (const table of tableKeys) {
    const def = tableDefinitions[table];
    const file = await readInputFile(def.fileName);
    if (!file.found) {
      const severity: ValidationIssue["severity"] = table === "B" ? "ERROR" : "WARNING";
      tables[table] = { table, logicalName: def.logicalName, fileName: def.fileName, fileFound: false, records: [], issues: [{ severity, table, logicalName: def.logicalName, line: 0, message: `File ${def.fileName} non presente nella cartella ${getInputDir()}` }], fileStatus: "MISSING" };
      recordsMap[table] = [];
      continue;
    }

    const records = parseFixedLengthContent(file.content, def);
    const issues = validateTable(records, def);
    tables[table] = { table, logicalName: def.logicalName, fileName: def.fileName, fileFound: true, records, issues, fileStatus: "FOUND" };
    recordsMap[table] = records;
  }

  const globalIssues = validateRelationsWithoutAnagrafica(recordsMap);
  const allIssues = [...Object.values(tables).flatMap((t) => t.issues), ...globalIssues];
  const errors = allIssues.filter((i) => i.severity === "ERROR").length;
  const warnings = allIssues.filter((i) => i.severity === "WARNING").length;

  return NextResponse.json({
    inputDir: getInputDir(),
    tables,
    globalIssues,
    summary: {
      totalExpectedFiles: tableKeys.length,
      filesFound: Object.values(tables).filter((t) => t.fileStatus === "FOUND").length,
      filesMissing: Object.values(tables).filter((t) => t.fileStatus === "MISSING").length,
      totalRecords: Object.values(tables).reduce((acc, t) => acc + t.records.length, 0),
      errors,
      warnings,
      validationStatus: errors > 0 ? "ERRORI PRESENTI" : warnings > 0 ? "WARNING" : "OK",
    },
  });
}
