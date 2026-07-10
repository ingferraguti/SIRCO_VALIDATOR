import { ParsedRecord, SircoTable, ValidationIssue } from "./types";
import { tableDefinitions } from "./definitions";

type ParsedMap = Record<SircoTable, ParsedRecord[]>;
const CHILD_TABLES: SircoTable[] = ["C", "D", "E", "F", "G"];

const CARDINALITY: Partial<Record<SircoTable, { min: number; max: number; label: string }>> = {
  C: { min: 1, max: 9, label: "motivi di ricovero" },
  D: { min: 1, max: 10, label: "diagnosi" },
  E: { min: 0, max: 15, label: "interventi/procedure" },
  F: { min: 1, max: 10, label: "problemi socio-familiari" },
  G: { min: 0, max: 99, label: "lesioni" },
};

const makeIssue = (record: ParsedRecord, code: ValidationIssue["code"], severity: ValidationIssue["severity"], message: string): ValidationIssue => ({
  id: `${record.table}:${record.line}:${code}:${message}`,
  code, severity, table: record.table, logicalName: tableDefinitions[record.table].logicalName, line: record.line, recordId: record.id,
  relationKey: record.relationKey, primaryKey: record.primaryKey, key: record.relationKey, value: record.primaryKey, message,
});

const parentIssue = (record: ParsedRecord, table: SircoTable, message: string): ValidationIssue => ({
  id: `B:${record.line}:CARDINALITY:${table}`,
  code: "CARDINALITY", severity: "ERROR", table: "B", logicalName: tableDefinitions.B.logicalName, line: record.line, recordId: record.id,
  relationKey: record.relationKey, primaryKey: record.primaryKey, key: record.relationKey, value: table, message,
});

export function validateRelationsWithoutAnagrafica(tables: ParsedMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bKeys = new Set(tables.B.map((r) => r.relationKey));
  for (const table of CHILD_TABLES) {
    const keys = new Map<string, ParsedRecord>();
    for (const record of tables[table]) {
      if (!bKeys.has(record.relationKey)) issues.push(makeIssue(record, "MISSING_PARENT", "ERROR", `Record figlio ${table} senza Ricovero corrispondente per chiave ${record.relationKey}`));
      if (keys.has(record.primaryKey)) issues.push(makeIssue(record, "DUPLICATE_KEY", "ERROR", `Chiave primaria completa duplicata: ${record.primaryKey}`));
      keys.set(record.primaryKey, record);
    }
  }
  for (const b of tables.B) {
    for (const table of CHILD_TABLES) {
      const count = tables[table].filter((r) => r.relationKey === b.relationKey).length;
      const cardinality = CARDINALITY[table];
      if (!cardinality) continue;
      if (count < cardinality.min) issues.push(parentIssue(b, table, `Il Ricovero ${b.relationKey} deve avere almeno ${cardinality.min} record ${table} (${cardinality.label})`));
      if (count > cardinality.max) issues.push(parentIssue(b, table, `Il Ricovero ${b.relationKey} non può avere più di ${cardinality.max} record ${table} (${cardinality.label})`));
    }
  }
  for (const b of tables.B) {
    const d = tables.D.filter((r) => r.relationKey === b.relationKey);
    if (d.length > 0 && !d.some((r) => r.fields.D04?.currentValue === "01")) issues.push(parentIssue(b, "D", "Deve essere presente almeno una diagnosi principale con progressivo D04=01"));
    const cMain = tables.C.filter((r) => r.relationKey === b.relationKey && r.fields.C05?.currentValue === "1");
    if (tables.C.some((r) => r.relationKey === b.relationKey) && cMain.length === 0) issues.push(parentIssue(b, "C", "Deve essere presente un motivo di ricovero principale con C05=1"));
    if (cMain.length > 1) issues.push(parentIssue(b, "C", "Deve essere presente un solo motivo principale per ricovero"));
    const f = tables.F.filter((r) => r.relationKey === b.relationKey);
    if (f.some((r) => r.fields.F04?.currentValue === "00") && f.length > 1) issues.push(parentIssue(b, "F", "Se F04=00 non devono essere presenti altri problemi per la stessa scheda"));
  }
  return issues;
}
