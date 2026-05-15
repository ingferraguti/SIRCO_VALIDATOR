import { ParsedRecord, SircoTable, ValidationIssue } from "./types";

type MapT = Record<SircoTable, ParsedRecord[]>;
const keySet = (records: ParsedRecord[]) => new Set(records.map((r) => r.logicalKey));

export function validateRelations(tables: MapT): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const aKeys = keySet(tables.A); const bKeys = keySet(tables.B);
  for (const b of tables.B) if (!aKeys.has(b.logicalKey)) issues.push({ severity:"ERROR", table:"B", line:b.line, message:"Record B senza corrispondente A", value:b.logicalKey });
  for (const a of tables.A) if (!bKeys.has(a.logicalKey)) issues.push({ severity:"WARNING", table:"A", line:a.line, message:"Record A senza corrispondente B", value:a.logicalKey });
  (["C","D","E","F","G"] as SircoTable[]).forEach((t) => {
    for (const r of tables[t]) if (!bKeys.has(r.logicalKey)) issues.push({ severity:"ERROR", table:t, line:r.line, message:`Record ${t} senza corrispondente B`, value:r.logicalKey });
  });
  return issues;
}
