import { NextResponse } from "next/server";
import { tableDefinitions } from "@/lib/sirco/definitions";
import { parseFixedLengthContent } from "@/lib/sirco/parser";
import { validateTable } from "@/lib/sirco/validator";
import { validateRelationsWithoutAnagrafica } from "@/lib/sirco/relational-validator";
import { discoverInputFiles, getInputDir, getOutputDir, loadExternalDomains, readDiscoveredFile } from "@/lib/sirco/file-reader";
import { SircoTable, TableResult, ValidationIssue } from "@/lib/sirco/types";

export async function GET() {
  const tableKeys = Object.keys(tableDefinitions) as SircoTable[];
  const tables = {} as Record<SircoTable, TableResult>;
  const recordsMap = {} as Record<SircoTable, ReturnType<typeof parseFixedLengthContent>>;
  const discovery = await discoverInputFiles();
  const externalDomains = await loadExternalDomains();

  for (const table of tableKeys) {
    const def = tableDefinitions[table];
    const found = discovery[table];
    if (found.status === "CONFIG_ERROR") {
      const configIssue: ValidationIssue = { id: `${table}:config`, code: "RECORD_LENGTH", severity: "ERROR", table, logicalName: def.logicalName, line: 0, message: found.message, value: found.files.join(", ") };
      tables[table] = { table, logicalName: def.logicalName, fileName: found.files.join(", "), filePattern: def.filePattern, fileFound: false, records: [], issues: [configIssue], fileStatus: "CONFIG_ERROR" };
      recordsMap[table] = [];
      continue;
    }
    if (found.status === "MISSING") {
      const severity: ValidationIssue["severity"] = table === "B" ? "ERROR" : "WARNING";
      tables[table] = { table, logicalName: def.logicalName, fileName: "", filePattern: def.filePattern, fileFound: false, records: [], issues: [{ id: `${table}:missing`, code: "RECORD_LENGTH", severity, table, logicalName: def.logicalName, line: 0, message: found.message }], fileStatus: "MISSING" };
      recordsMap[table] = [];
      continue;
    }
    const records = parseFixedLengthContent(await readDiscoveredFile(found), def);
    const issues = validateTable(records, def, {}, externalDomains);
    tables[table] = { table, logicalName: def.logicalName, fileName: found.fileName, filePattern: def.filePattern, fileFound: true, records, issues, fileStatus: "FOUND" };
    recordsMap[table] = records;
  }

  const globalIssues = validateRelationsWithoutAnagrafica(recordsMap);
  const allIssues = [...Object.values(tables).flatMap((t) => t.issues), ...globalIssues];
  const errors = allIssues.filter((i) => i.severity === "ERROR").length;
  const warnings = allIssues.filter((i) => i.severity === "WARNING").length;
  const infos = allIssues.filter((i) => i.severity === "INFO").length;

  return NextResponse.json({
    inputDir: getInputDir(), outputDir: getOutputDir(), tables, globalIssues,
    exportMessage: "I file originali in data/input non vengono modificati. I file corretti vengono scritti in data/output.",
    summary: { totalExpectedFiles: tableKeys.length, filesFound: Object.values(tables).filter((t) => t.fileStatus === "FOUND").length, filesMissing: Object.values(tables).filter((t) => t.fileStatus === "MISSING").length, totalRecords: Object.values(tables).reduce((acc, t) => acc + t.records.length, 0), errors, warnings, infos, validationStatus: errors > 0 ? "ERRORI PRESENTI" : warnings > 0 ? "WARNING" : "OK" },
  });
}
