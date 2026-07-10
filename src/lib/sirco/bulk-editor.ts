import { protectedFieldCodes } from "./definitions";
import { FieldDefinition, BulkAction, ChangeLogEntry, ParsedRecord, SircoTable, TableDefinition } from "./types";
import { alignFieldValue, setFieldValue } from "./parser";

export type BulkEditRequest = { table: SircoTable; fieldCode: string; action: BulkAction; value?: string; sourceFieldCode?: string; selectedRecordIds: readonly string[] };
export type BulkPreviewRow = { recordId: string; previousValue: string; nextValue: string; applicable: boolean; error?: string };
export type BulkPreview = { atomic: boolean; table: SircoTable; fieldCode: string; affectedCount: number; rows: BulkPreviewRow[]; errors: string[] };
export type BulkApplyResult = { records: ParsedRecord[]; changeLogEntry: ChangeLogEntry; preview: BulkPreview };

const transform = (record: ParsedRecord, field: FieldDefinition, request: BulkEditRequest): string => {
  const current = record.fields[request.fieldCode]?.currentValue ?? "";
  switch (request.action) {
    case "set": return request.value ?? "";
    case "clear": return "";
    case "copy": return record.fields[request.sourceFieldCode ?? ""]?.currentValue ?? "";
    case "replace": { const [from, to = ""] = (request.value ?? "").split("=>"); return current.replaceAll(from, to); }
    case "prefix": return `${request.value ?? ""}${current}`;
    case "suffix": return `${current}${request.value ?? ""}`;
    case "normalizeAlignment": return alignFieldValue(current.trim(), field);
    case "restoreOriginal": return record.fields[request.fieldCode]?.originalValue ?? "";
  }
};

export function previewBulkEdit(records: readonly ParsedRecord[], definition: TableDefinition, request: BulkEditRequest): BulkPreview {
  const field = definition.fields.find((item) => item.code === request.fieldCode);
  const selected = records.filter((record) => request.selectedRecordIds.includes(record.id));
  const errors: string[] = [];
  if (!field) errors.push(`Campo ${request.fieldCode} non definito`);
  if (protectedFieldCodes.has(request.fieldCode)) errors.push(`Campo protetto ${request.fieldCode}: modifica massiva non consentita`);
  const rows = selected.map((record) => {
    if (!field) return { recordId: record.id, previousValue: "", nextValue: "", applicable: false, error: "Campo non definito" };
    const previousValue = record.fields[request.fieldCode]?.currentValue ?? "";
    const nextValue = transform(record, field, request);
    const error = nextValue.length > field.length
      ? `Valore troppo lungo (${nextValue.length}/${field.length})`
      : field.filler && !/^[ ]*$/.test(nextValue)
        ? `Il campo ${field.code} ammette solo il placeholder spazio`
        : undefined;
    return { recordId: record.id, previousValue, nextValue, applicable: !error, error };
  });
  for (const row of rows) if (row.error) errors.push(`${row.recordId}: ${row.error}`);
  return { atomic: errors.length === 0, table: request.table, fieldCode: request.fieldCode, affectedCount: selected.length, rows, errors };
}

export function applyBulkEdit(records: readonly ParsedRecord[], definition: TableDefinition, request: BulkEditRequest): BulkApplyResult {
  const preview = previewBulkEdit(records, definition, request);
  if (!preview.atomic) throw new Error(preview.errors.join("; "));
  const byId = new Map(preview.rows.map((row) => [row.recordId, row]));
  const nextRecords = records.map((record) => byId.has(record.id) ? setFieldValue(record, definition, request.fieldCode, byId.get(record.id)?.nextValue ?? "") : record);
  const previousValues = Object.fromEntries(preview.rows.map((row) => [row.recordId, row.previousValue]));
  const newValues = Object.fromEntries(preview.rows.map((row) => [row.recordId, row.nextValue]));
  return { records: nextRecords, preview, changeLogEntry: { id: `change:${Date.now()}`, timestamp: new Date().toISOString(), mode: "BULK", table: request.table, fieldCode: request.fieldCode, affectedRecordIds: preview.rows.map((row) => row.recordId), previousValues, newValues, description: `Modifica massiva ${request.action} su ${preview.affectedCount} record` } };
}

export function undoChange(records: readonly ParsedRecord[], definition: TableDefinition, entry: ChangeLogEntry): ParsedRecord[] {
  return records.map((record) => entry.previousValues[record.id] !== undefined ? setFieldValue(record, definition, entry.fieldCode, entry.previousValues[record.id]) : record);
}
