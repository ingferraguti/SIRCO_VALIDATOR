import { ParsedRecord, SircoTable, ValidationIssue } from "./types";
import { tableDefinitions } from "./definitions";

type MapT = Record<SircoTable, ParsedRecord[]>;
const keySet = (records: ParsedRecord[]) => new Set(records.map((r) => r.logicalKey));

export function validateRelations(tables: MapT): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bKeys = keySet(tables.B);
  (["C", "D", "E", "F", "G"] as SircoTable[]).forEach((t) => {
    for (const r of tables[t]) {
      if (!bKeys.has(r.logicalKey)) {
        issues.push({
          severity: "ERROR",
          table: t,
          logicalName: tableDefinitions[t].logicalName,
          line: r.line,
          key: r.logicalKey,
          message: `Record presente in ${tableDefinitions[t].logicalName} ma assente in Ricoveri per la chiave ${r.logicalKey}`,
          value: r.logicalKey,
        });
      }
    }
  });
  return issues;
}
