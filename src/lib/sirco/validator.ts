import { ParsedRecord, TableDefinition, ValidationIssue } from "./types";

const isBlank = (v: string): boolean => v.trim().length === 0;
const validDate = (v: string): boolean => {
  if (!/^\d{8}$/.test(v)) return false;
  const dd = Number(v.slice(0, 2)); const mm = Number(v.slice(2, 4)); const yyyy = Number(v.slice(4, 8));
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};
const toDate = (v: string): Date | null => validDate(v) ? new Date(Number(v.slice(4, 8)), Number(v.slice(2, 4)) - 1, Number(v.slice(0, 2))) : null;
const daysBetweenInclusive = (start: Date, end: Date): number => Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

export function validateTable(records: ParsedRecord[], definition: TableDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keySeen = new Set<string>();
  for (const r of records) {
    if (r.raw.length !== definition.recordLength) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, message: `Lunghezza record attesa ${definition.recordLength}, trovata ${r.raw.length}` });
    for (const f of definition.fields) {
      const v = r.fields[f.code] ?? "";
      if (f.required && isBlank(v)) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: f.code, fieldName: f.name, value: v, message: "Campo obbligatorio vuoto" });
      if (f.type === "N" && !isBlank(v) && !/^\d+$/.test(v)) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: f.code, fieldName: f.name, value: v, message: "Campo numerico non valido" });
      if (f.type === "DT" && !isBlank(v) && !validDate(v)) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: f.code, fieldName: f.name, value: v, message: "Data non valida (formato GGMMAAAA)" });
      if (f.domain && !isBlank(v) && !f.domain.includes(v)) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: f.code, fieldName: f.name, value: v, message: "Valore fuori dominio" });
    }
    if (definition.table === "B") {
      const dIn = toDate(r.fields.B04 ?? ""); const dOut = toDate(r.fields.B08 ?? ""); const dEle = toDate(r.fields.B22 ?? "");
      if (dIn && dOut && dIn > dOut) issues.push({ severity: "ERROR", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: "B04", fieldName: "Data ricovero", value: r.fields.B04, message: "Data ricovero deve essere <= data dimissione/decesso" });
      if (dIn && dOut) {
        const degenza = daysBetweenInclusive(dIn, dOut);
        const assenze = /^\d+$/.test(r.fields.B09 ?? "") ? Number(r.fields.B09) : null;
        if (assenze !== null && assenze > degenza) issues.push({ severity: "ERROR", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: "B09", fieldName: "Giornate assenza temporanea", value: r.fields.B09, message: "Giornate assenza temporanea non può superare le giornate di degenza" });
        if (degenza > 42) issues.push({ severity: "WARNING", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: "B08", fieldName: "Data dimissione/decesso", value: r.fields.B08, message: "Giornate effettive di degenza superiori a 42 giorni" });
      }
      if ((r.fields.B06 ?? "") === "2" && (r.fields.B15 ?? "") === "09") issues.push({ severity: "ERROR", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: "B15", fieldName: "Tipologia valutazione multidisciplinare", value: r.fields.B15, message: "Se B06=2 allora B15 deve essere diverso da 09" });
      ["B13", "B14"].forEach((fieldCode) => {
        const v = r.fields[fieldCode] ?? "";
        if (!isBlank(v) && /^\d{3}$/.test(v) && (Number(v) < 0 || Number(v) > 100)) {
          issues.push({ severity: "ERROR", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode, fieldName: fieldCode === "B13" ? "Valutazione ADL ingresso" : "Valutazione ADL dimissione", value: v, message: "Valore ADL deve essere compreso tra 000 e 100" });
        }
      });
      if (dEle && dIn && dEle > dIn) issues.push({ severity: "ERROR", table: "B", logicalName: definition.logicalName, line: r.line, key: r.logicalKey, fieldCode: "B22", fieldName: "Data eleggibilità ricovero", value: r.fields.B22, message: "Data eleggibilità ricovero deve essere <= data ricovero" });
    }
    if (keySeen.has(r.logicalKey)) issues.push({ severity: "ERROR", table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey, message: "Chiave duplicata nella stessa tabella", value: r.logicalKey });
    keySeen.add(r.logicalKey);
  }
  return issues;
}
