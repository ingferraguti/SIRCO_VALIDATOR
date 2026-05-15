import { ParsedRecord, TableDefinition, ValidationIssue } from "./types";

const isBlank = (v: string): boolean => v.trim().length === 0;

const parseDate = (v: string): Date | null => {
  if (!/^\d{8}$/.test(v)) return null;
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yyyy = Number(v.slice(4, 8));
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd ? d : null;
};

const daysBetweenInclusive = (start: Date, end: Date): number => Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

export function validateTable(records: ParsedRecord[], definition: TableDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keySeen = new Set<string>();

  for (const r of records) {
    const push = (issue: Omit<ValidationIssue, "table" | "logicalName" | "line" | "key">) => {
      issues.push({ ...issue, table: definition.table, logicalName: definition.logicalName, line: r.line, key: r.logicalKey });
    };

    if (r.raw.length !== definition.recordLength) push({ severity: "ERROR", message: `Lunghezza record attesa ${definition.recordLength}, trovata ${r.raw.length}` });
    for (const f of definition.fields) {
      const v = r.fields[f.code] ?? "";
      if (f.required && isBlank(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Campo obbligatorio vuoto" });
      if (f.type === "N" && !isBlank(v) && !/^\d+$/.test(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Campo numerico non valido" });
      if (f.type === "DT" && !isBlank(v) && !parseDate(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Data non valida (formato GGMMAAAA)" });
      if (f.domain && !isBlank(v) && !f.domain.includes(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Valore fuori dominio" });
      if (f.filler && /\S/.test(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Filler deve contenere solo spazi" });
      if (f.key && isBlank(v)) push({ severity: "ERROR", fieldCode: f.code, fieldName: f.name, value: v, message: "Campo chiave obbligatorio mancante" });
    }

    if (definition.table === "B") {
      const b04 = parseDate(r.fields.B04 ?? "");
      const b08 = parseDate(r.fields.B08 ?? "");
      const b22 = parseDate(r.fields.B22 ?? "");
      const b09 = r.fields.B09 ?? "";
      const b06 = r.fields.B06 ?? "";
      const b15 = r.fields.B15 ?? "";
      const b13 = r.fields.B13 ?? "";
      const b14 = r.fields.B14 ?? "";

      if (b04 && b08 && b04.getTime() > b08.getTime()) push({ severity: "ERROR", fieldCode: "B04", fieldName: "Data ricovero", value: r.fields.B04, message: "B04 deve essere <= B08" });
      if (b04 && b08 && /^\d+$/.test(b09)) {
        const degenza = daysBetweenInclusive(b04, b08);
        if (Number(b09) > degenza) push({ severity: "ERROR", fieldCode: "B09", fieldName: "Giornate assenza temporanea", value: b09, message: "B09 non può superare le giornate di degenza" });
        if (degenza > 42) push({ severity: "WARNING", fieldCode: "B08", fieldName: "Data dimissione/decesso", value: `${degenza}`, message: "Giornate effettive di degenza superiori a 42" });
      }
      if (b06 === "2" && b15 === "09") push({ severity: "ERROR", fieldCode: "B15", fieldName: "Tipologia valutazione multidisciplinare", value: b15, message: "Se B06=2, B15 deve essere diverso da 09" });
      if (!isBlank(b13) && /^\d+$/.test(b13) && (Number(b13) < 0 || Number(b13) > 100)) push({ severity: "ERROR", fieldCode: "B13", fieldName: "Valutazione ADL ingresso", value: b13, message: "B13 deve essere compreso tra 000 e 100" });
      if (!isBlank(b14) && /^\d+$/.test(b14) && (Number(b14) < 0 || Number(b14) > 100)) push({ severity: "ERROR", fieldCode: "B14", fieldName: "Valutazione ADL dimissione", value: b14, message: "B14 deve essere compreso tra 000 e 100" });
      if (b22 && b04 && b22.getTime() > b04.getTime()) push({ severity: "ERROR", fieldCode: "B22", fieldName: "Data eleggibilità ricovero", value: r.fields.B22, message: "B22 deve essere <= B04" });
    }

    if (keySeen.has(r.logicalKey)) push({ severity: "ERROR", message: "Chiave duplicata nella stessa tabella", value: r.logicalKey });
    keySeen.add(r.logicalKey);
  }

  return issues;
}
