import { ParsedRecord, TableDefinition, ValidationIssue } from "./types";

const isBlank = (v: string): boolean => v.trim().length === 0;
const validDate = (v: string): boolean => {
  if (!/^\d{8}$/.test(v)) return false;
  const dd = Number(v.slice(0,2)); const mm = Number(v.slice(2,4)); const yyyy = Number(v.slice(4,8));
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};

export function validateTable(records: ParsedRecord[], definition: TableDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keySeen = new Set<string>();
  for (const r of records) {
    if (r.raw.length !== definition.recordLength) issues.push({ severity:"ERROR", table:definition.table, line:r.line, message:`Lunghezza record attesa ${definition.recordLength}, trovata ${r.raw.length}` });
    for (const f of definition.fields) {
      const v = r.fields[f.code] ?? "";
      if (f.required && isBlank(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Campo obbligatorio vuoto" });
      if (f.type === "N" && !isBlank(v) && !/^\d+$/.test(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Campo numerico non valido" });
      if (f.type === "DT" && !isBlank(v) && !validDate(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Data non valida (formato GGMMAAAA)" });
      if (f.domain && !isBlank(v) && !f.domain.includes(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Valore fuori dominio" });
      if (f.filler && /\S/.test(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Filler deve contenere solo spazi" });
      if (f.key && isBlank(v)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, fieldCode:f.code, fieldName:f.name, value:v, message:"Campo chiave obbligatorio mancante" });
    }
    if (keySeen.has(r.logicalKey)) issues.push({ severity:"ERROR", table:definition.table, line:r.line, message:"Chiave duplicata nella stessa tabella", value:r.logicalKey });
    keySeen.add(r.logicalKey);
  }
  return issues;
}
