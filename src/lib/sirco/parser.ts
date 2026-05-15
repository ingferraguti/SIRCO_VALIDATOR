import { TableDefinition, ParsedRecord } from "./types";

export function parseFixedLengthContent(content: string, definition: TableDefinition): ParsedRecord[] {
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
  return lines.map((raw, index) => {
    const fields: Record<string, string> = {};
    for (const field of definition.fields) {
      fields[field.code] = raw.slice(field.start - 1, field.end);
    }
    const key = definition.fields.filter((f) => f.key).map((f) => fields[f.code] ?? "").join("|");
    return { table: definition.table, line: index + 1, raw, recordLength: raw.length, fields, logicalKey: key };
  });
}
