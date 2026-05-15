import { ParsedRecord, SircoTable, ValidationIssue } from "./types";

type ParsedMap = Record<SircoTable, ParsedRecord[]>;

const CHILD_TABLES: SircoTable[] = ["C", "D", "E", "F", "G"];

const makeProgressiveKey = (record: ParsedRecord): string => {
  const progressive = Object.entries(record.fields)
    .find(([fieldCode]) => fieldCode.endsWith("04"))?.[1] ?? "";
  return `${record.logicalKey}|${progressive}`;
};

export function validateRelationsWithoutAnagrafica(tables: ParsedMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bKeys = new Set<string>();

  for (const record of tables.B) {
    if (bKeys.has(record.logicalKey)) {
      issues.push({ severity: "ERROR", table: "B", line: record.line, message: "Chiave duplicata in Ricoveri", value: record.logicalKey });
    }
    bKeys.add(record.logicalKey);
  }

  for (const table of CHILD_TABLES) {
    const duplicateCheck = new Set<string>();
    for (const record of tables[table]) {
      if (!bKeys.has(record.logicalKey)) {
        issues.push({ severity: "ERROR", table, line: record.line, message: `Record presente in ${table} ma assente in Ricoveri per la chiave ${record.logicalKey}`, value: record.logicalKey });
      }

      const progressiveKey = makeProgressiveKey(record);
      if (duplicateCheck.has(progressiveKey)) {
        issues.push({ severity: "ERROR", table, line: record.line, message: "Duplicato chiave + progressivo nella tabella figlia", value: progressiveKey });
      }
      duplicateCheck.add(progressiveKey);
    }
  }

  return issues;
}
