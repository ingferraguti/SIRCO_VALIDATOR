import { ParsedRecord, SircoTable, ValidationIssue } from "./types";
import { SIRCO_FILE_MAP } from "./definitions";

type ParsedMap = Record<SircoTable, ParsedRecord[]>;

const CHILD_TABLES: SircoTable[] = ["C", "D", "E", "F", "G"];

const makeProgressiveKey = (record: ParsedRecord): string => {
  const progressive = Object.entries(record.fields).find(([fieldCode]) => fieldCode.endsWith("04"))?.[1] ?? "";
  return `${record.logicalKey}|${progressive}`;
};

export function validateRelationsWithoutAnagrafica(tables: ParsedMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bKeys = new Set<string>();

  for (const record of tables.B) {
    bKeys.add(record.logicalKey);
  }

  for (const table of CHILD_TABLES) {
    const duplicateCheck = new Set<string>();
    for (const record of tables[table]) {
      if (!bKeys.has(record.logicalKey)) {
        issues.push({ severity: "ERROR", table, logicalName: SIRCO_FILE_MAP[table].logicalName, line: record.line, key: record.logicalKey, message: `Record presente in ${SIRCO_FILE_MAP[table].logicalName} ma assente in Ricoveri per la chiave ${record.logicalKey}`, value: record.logicalKey });
      }
      const progressiveKey = makeProgressiveKey(record);
      if (duplicateCheck.has(progressiveKey)) {
        issues.push({ severity: "ERROR", table, logicalName: SIRCO_FILE_MAP[table].logicalName, line: record.line, key: record.logicalKey, message: "Duplicato chiave + progressivo nella tabella figlia", value: progressiveKey });
      }
      duplicateCheck.add(progressiveKey);
    }
  }

  return issues;
}
