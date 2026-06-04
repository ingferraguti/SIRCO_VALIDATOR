import { FieldDefinition, ParsedRecord, TableDefinition, ValidationContext, ValidationIssue, ValidationIssueCode, ValidationSeverity } from "./types";

const isBlank = (v: string): boolean => /^[ ]*$/.test(v);
export const parseSircoDate = (v: string): Date | null => {
  if (!/^\d{8}$/.test(v)) return null;
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yyyy = Number(v.slice(4, 8));
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return d.getUTCFullYear() === yyyy && d.getUTCMonth() === mm - 1 && d.getUTCDate() === dd ? d : null;
};
const daysInclusive = (start: Date, end: Date): number => Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
const val = (r: ParsedRecord, code: string): string => r.fields[code]?.currentValue ?? "";

function issue(def: TableDefinition, r: ParsedRecord | undefined, code: ValidationIssueCode, severity: ValidationSeverity, message: string, field?: FieldDefinition, value?: string): ValidationIssue {
  return { id: `${def.table}:${r?.line ?? 0}:${code}:${field?.code ?? "record"}:${message}`, code, severity, table: def.table, logicalName: def.logicalName, line: r?.line, recordId: r?.id, relationKey: r?.relationKey, primaryKey: r?.primaryKey, key: r?.relationKey, fieldCode: field?.code, fieldName: field?.name, value, message };
}

const hasInvalidCharacters = (v: string): boolean => !/^[\x20-\x7EÀ-ÖØ-öø-ÿ]*$/.test(v);
const invalidANAlignment = (v: string): boolean => v.length > 0 && /^ +\S/.test(v);
const invalidNAlignment = (v: string): boolean => v.length > 0 && /\S +$/.test(v);

export function validateTable(records: ParsedRecord[], definition: TableDefinition, context: ValidationContext = {}, externalDomains: Record<string, readonly string[]> = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, ParsedRecord>();
  const missingDomainCodes = new Set<string>();

  for (const r of records) {
    if (r.currentLength !== definition.recordLength) issues.push(issue(definition, r, "RECORD_LENGTH", "ERROR", `Lunghezza record attesa ${definition.recordLength}, trovata ${r.currentLength}`));
    for (const f of definition.fields) {
      const v = val(r, f.code);
      if (v.length > f.length) issues.push(issue(definition, r, "VALUE_TOO_LONG", "ERROR", `Valore più lungo della lunghezza prevista ${f.length}`, f, v));
      if (hasInvalidCharacters(v)) issues.push(issue(definition, r, "INVALID_CHARACTERS", "ERROR", "Caratteri non ammessi o non rappresentabili nel formato previsto", f, v));
      if ((f.required || f.key) && isBlank(v)) issues.push(issue(definition, r, "REQUIRED", f.requiredSeverity ?? "ERROR", f.key ? "Campo chiave obbligatorio mancante" : "Campo obbligatorio vuoto", f, v));
      if (f.type === "N" && !isBlank(v) && !/^\d+$/.test(v)) issues.push(issue(definition, r, "INVALID_NUMERIC", "ERROR", "Campo numerico non valido", f, v));
      if (f.type === "DT" && !isBlank(v) && !parseSircoDate(v)) issues.push(issue(definition, r, "INVALID_DATE", "ERROR", "Data non valida (formato GGMMAAAA)", f, v));
      if (f.type === "DT" && f.length !== 8) issues.push(issue(definition, r, "RECORD_LENGTH", "ERROR", "Campo data con lunghezza diversa da 8", f, v));
      if (f.domain && !isBlank(v) && !f.domain.includes(v)) issues.push(issue(definition, r, "INVALID_DOMAIN", "ERROR", "Valore fuori dominio statico", f, v));
      if (f.externalDomainCode && !isBlank(v)) {
        const domain = externalDomains[f.externalDomainCode];
        if (domain && !domain.includes(v)) issues.push(issue(definition, r, "INVALID_DOMAIN", "ERROR", `Valore non presente nel dominio locale ${f.externalDomainCode}`, f, v));
        if (!domain) missingDomainCodes.add(f.externalDomainCode);
      }
      if (f.filler && !isBlank(v)) issues.push(issue(definition, r, "INVALID_FILLER", "ERROR", "Filler deve contenere solo spazi", f, v));
      if (f.type === "AN" && invalidANAlignment(v)) issues.push(issue(definition, r, "INVALID_ALIGNMENT", "WARNING", "Campo AN non allineato a sinistra", f, v));
      if ((f.type === "N" || f.type === "DT") && invalidNAlignment(v)) issues.push(issue(definition, r, "INVALID_ALIGNMENT", "WARNING", "Campo numerico/data non allineato a destra", f, v));
    }

    if (seen.has(r.primaryKey)) issues.push(issue(definition, r, "DUPLICATE_KEY", "ERROR", `Chiave primaria duplicata: ${r.primaryKey}`, undefined, r.primaryKey));
    seen.set(r.primaryKey, r);

    issues.push(...validateLocalTableRules(r, definition, context));
  }
  for (const code of missingDomainCodes) issues.push(issue(definition, undefined, "EXTERNAL_DOMAIN_NOT_CHECKED", "INFO", `Dominio esterno ${code}.json non disponibile: controllo non eseguito localmente una sola volta.`));
  if (definition.table === "B") issues.push(issue(definition, undefined, "DATABASE_CONTROL_NOT_CHECKED", "INFO", "Controlli I/V/C rispetto alla banca dati regionale non verificabili localmente."));
  return issues;
}

function validateLocalTableRules(r: ParsedRecord, def: TableDefinition, context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const f = (code: string): FieldDefinition | undefined => def.fields.find((item) => item.code === code);
  const push = (code: ValidationIssueCode, severity: ValidationSeverity, fieldCode: string, message: string, value = val(r, fieldCode)) => issues.push(issue(def, r, code, severity, message, f(fieldCode), value));
  if (def.table === "B") {
    const b03 = val(r, "B03"), b04s = val(r, "B04"), b08s = val(r, "B08"), b09 = val(r, "B09"), b22s = val(r, "B22");
    const b04 = parseSircoDate(b04s), b08 = parseSircoDate(b08s), b22 = parseSircoDate(b22s);
    if (!/^\d{2}[0-9]{6}$/.test(b03) || b03.slice(2) === "000000") push("CROSS_FIELD", "ERROR", "B03", "B03 deve avere ultime 6 cifre numeriche e diverse da zero", b03);
    if (b04 && b03.slice(0, 2) !== String(b04.getUTCFullYear()).slice(2)) push("CROSS_FIELD", "ERROR", "B03", "Prime 2 cifre di B03 non congruenti con l'anno di B04", b03);
    if (b04 && b08 && b04.getTime() > b08.getTime()) push("CROSS_FIELD", "ERROR", "B04", "B04 deve essere minore o uguale a B08", b04s);
    if (b04 && b08 && /^\d+$/.test(b09)) { const degenza = daysInclusive(b04, b08); if (Number(b09) > degenza) push("CROSS_FIELD", "ERROR", "B09", "B09 non può superare le giornate effettive di degenza", b09); if (degenza > 42) push("CROSS_FIELD", "WARNING", "B08", "Degenza superiore a 42 giorni", String(degenza)); }
    for (const code of ["B13", "B14"]) { const v = val(r, code); if (!isBlank(v) && /^\d+$/.test(v) && Number(v) > 100) push("CROSS_FIELD", "ERROR", code, `${code} deve essere compreso tra 000 e 100`, v); }
    if (val(r, "B06") === "2" && val(r, "B15") === "09") push("CROSS_FIELD", "ERROR", "B15", "B15 deve essere diverso da 09 quando B06=2");
    if (val(r, "B18") === "1" && (["B19","B20","B21"].some((code) => isBlank(val(r, code))))) push("CROSS_FIELD", "ERROR", "B18", "Se B18=1 i dati COT B19, B20 e B21 devono essere compilati");
    if (val(r, "B18") === "2" && (["B19","B20","B21"].some((code) => !isBlank(val(r, code))))) push("CROSS_FIELD", "WARNING", "B18", "Se B18=2 i dati COT compilati non sono coerenti");
    if (b22 && b04 && b22.getTime() > b04.getTime()) push("CROSS_FIELD", "ERROR", "B22", "B22 deve essere minore o uguale alla data di ricovero B04", b22s);
    if (val(r, "B05") !== "01" && isBlank(val(r, "B23"))) push("REQUIRED", "ERROR", "B23", "B23 obbligatoria quando B05 è diversa da 01");
    if (!context.referenceYear) issues.push(issue(def, r, "DATABASE_CONTROL_NOT_CHECKED", "INFO", "Controlli dipendenti da anno/periodo/invio o regole regionali su B24/B25 non eseguiti: contesto non configurato."));
  }
  if (def.table === "D") {
    if (val(r, "D05") && !/^[A-Z0-9. ]+$/.test(val(r, "D05"))) push("CROSS_FIELD", "ERROR", "D05", "Codice diagnosi formalmente non coerente");
  }
  if (def.table === "G") {
    const t = val(r, "G05");
    if ((t === "1" || t === "2") && isBlank(val(r, "G06"))) push("REQUIRED", "ERROR", "G06", "Stadio iniziale obbligatorio per tipologia lesione 1 o 2");
    if ((t === "1" || t === "2") && isBlank(val(r, "G07"))) push("REQUIRED", "ERROR", "G07", "Stadio alla dimissione obbligatorio per tipologia lesione 1 o 2");
    if (t === "3" && (!isBlank(val(r, "G06")) || !isBlank(val(r, "G07")))) push("CROSS_FIELD", "ERROR", "G05", "Per tipologia lesione 3 gli stadi della lesione da pressione non devono essere compilati");
  }
  return issues;
}
