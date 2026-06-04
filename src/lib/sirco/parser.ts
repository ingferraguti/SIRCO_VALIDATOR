import { FieldDefinition, ParsedRecord, TableDefinition } from "./types";
import { relationKeyFields } from "./definitions";

const keyFrom = (fields: Record<string, string>, codes: readonly string[]): string => codes.map((code) => fields[code] ?? "").join("|");

export function alignFieldValue(value: string, field: FieldDefinition): string {
  if (value.length > field.length) throw new Error(`Il valore del campo ${field.code} supera la lunghezza massima ${field.length}`);
  if (field.type === "N") return value.padStart(field.length, " ");
  return value.padEnd(field.length, " ");
}

export function rebuildRecord(record: ParsedRecord, definition: TableDefinition): string {
  const chars = Array.from({ length: definition.recordLength }, (_, index) => record.currentRecord[index] ?? " ");
  for (const field of definition.fields) {
    const value = record.fields[field.code]?.currentValue ?? "";
    const aligned = alignFieldValue(value, field);
    for (let i = 0; i < field.length; i += 1) chars[field.start - 1 + i] = aligned[i] ?? " ";
  }
  return chars.join("");
}

export function parseFixedLengthContent(content: string, definition: TableDefinition): ParsedRecord[] {
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
  return lines.map((originalRecord, index) => {
    const rawFields: Record<string, string> = {};
    const fields: ParsedRecord["fields"] = {};
    for (const field of definition.fields) {
      const value = originalRecord.slice(field.start - 1, field.end);
      rawFields[field.code] = value;
      fields[field.code] = { originalValue: value, currentValue: value, changed: false };
    }
    const relationKey = keyFrom(rawFields, relationKeyFields(definition.table));
    const primaryKey = keyFrom(rawFields, definition.primaryKeyFields);
    return {
      id: `${definition.table}:${index + 1}:${primaryKey}`,
      table: definition.table,
      line: index + 1,
      originalRecord,
      currentRecord: originalRecord,
      originalLength: originalRecord.length,
      currentLength: originalRecord.length,
      relationKey,
      primaryKey,
      fields,
      changed: false,
      raw: originalRecord,
      recordLength: originalRecord.length,
      logicalKey: relationKey,
    };
  });
}

export function setFieldValue(record: ParsedRecord, definition: TableDefinition, fieldCode: string, value: string): ParsedRecord {
  const field = definition.fields.find((item) => item.code === fieldCode);
  if (!field) throw new Error(`Campo ${fieldCode} non definito per la tabella ${definition.table}`);
  if (value.length > field.length) throw new Error(`Il valore del campo ${field.code} supera la lunghezza massima ${field.length}`);
  const fields: ParsedRecord["fields"] = Object.fromEntries(Object.entries(record.fields).map(([code, item]) => [code, { ...item }]) ) as ParsedRecord["fields"];
  const originalValue = fields[fieldCode]?.originalValue ?? "";
  fields[fieldCode] = { originalValue, currentValue: value, changed: value !== originalValue };
  const draft: ParsedRecord = { ...record, fields };
  const currentRecord = rebuildRecord(draft, definition);
  const currentRawFields = Object.fromEntries(Object.entries(fields).map(([code, item]) => [code, item.currentValue]));
  const relationKey = keyFrom(currentRawFields, relationKeyFields(definition.table));
  const primaryKey = keyFrom(currentRawFields, definition.primaryKeyFields);
  const changed = Object.values(fields).some((item) => item.changed);
  return { ...draft, currentRecord, currentLength: currentRecord.length, relationKey, primaryKey, logicalKey: relationKey, changed };
}

export function restoreField(record: ParsedRecord, definition: TableDefinition, fieldCode: string): ParsedRecord {
  return setFieldValue(record, definition, fieldCode, record.fields[fieldCode]?.originalValue ?? "");
}

export function restoreRecord(record: ParsedRecord): ParsedRecord {
  const fields = Object.fromEntries(Object.entries(record.fields).map(([code, item]) => [code, { ...item, currentValue: item.originalValue, changed: false }])) as ParsedRecord["fields"];
  return { ...record, currentRecord: record.originalRecord, currentLength: record.originalLength, fields, relationKey: record.logicalKey, primaryKey: record.primaryKey, changed: false };
}
