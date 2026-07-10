import { ParsedRecord, QueryCondition, QueryGroup, ValidationIssue } from "./types";

const valueOf = (record: ParsedRecord, fieldCode?: string): string => fieldCode ? record.fields[fieldCode]?.currentValue ?? "" : "";
const list = (value?: string): string[] => (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);

export function matchesCondition(record: ParsedRecord, issues: readonly ValidationIssue[], condition: QueryCondition): boolean {
  const v = valueOf(record, condition.fieldCode);
  const expected = condition.value ?? "";
  const recordIssues = issues.filter((i) => i.recordId === record.id || (i.table === record.table && i.line === record.line));
  switch (condition.operator) {
    case "eq": return v === expected;
    case "neq": return v !== expected;
    case "contains": return v.includes(expected);
    case "notContains": return !v.includes(expected);
    case "startsWith": return v.startsWith(expected);
    case "endsWith": return v.endsWith(expected);
    case "isEmpty": return /^[ ]*$/.test(v);
    case "isNotEmpty": return !/^[ ]*$/.test(v);
    case "in": return list(expected).includes(v);
    case "notIn": return !list(expected).includes(v);
    case "gt": return v > expected;
    case "lt": return v < expected;
    case "gte": return v >= expected;
    case "lte": return v <= expected;
    case "hasError": return recordIssues.some((i) => i.severity === "ERROR");
    case "hasWarning": return recordIssues.some((i) => i.severity === "WARNING");
    case "hasIssueCode": return recordIssues.some((i) => i.code === expected);
    case "isChanged": return condition.fieldCode ? record.fields[condition.fieldCode]?.changed === true : record.changed;
    case "isNotChanged": return condition.fieldCode ? record.fields[condition.fieldCode]?.changed !== true : !record.changed;
  }
}

export function filterRecords(records: readonly ParsedRecord[], issues: readonly ValidationIssue[], query: QueryGroup): ParsedRecord[] {
  return records.filter((record) => query.combinator === "AND"
    ? query.conditions.every((condition) => matchesCondition(record, issues, condition))
    : query.conditions.some((condition) => matchesCondition(record, issues, condition)));
}
