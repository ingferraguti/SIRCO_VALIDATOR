export type SircoTable = "B" | "C" | "D" | "E" | "F" | "G";

export type FieldDefinition = {
  code: string;
  name: string;
  start: number;
  end: number;
  length: number;
  type: "AN" | "N" | "DT";
  required?: boolean;
  filler?: boolean;
  domain?: string[];
  key?: boolean;
};

export type TableDefinition = {
  table: SircoTable;
  logicalName: string;
  fileName: string;
  recordLength: number;
  fields: FieldDefinition[];
};

export type EditableFieldValue = {
  originalValue: string;
  currentValue: string;
  changed: boolean;
};

export type ParsedRecord = {
  table: SircoTable;
  tableLogicalName: string;
  line: number;
  raw: string;
  recordLength: number;
  fields: Record<string, string>;
  editableFields: Record<string, EditableFieldValue>;
  logicalKey: string;
};

export type ValidationIssue = {
  severity: "ERROR" | "WARNING";
  table: SircoTable;
  logicalName: string;
  line: number;
  key?: string;
  fieldCode?: string;
  fieldName?: string;
  message: string;
  value?: string;
};

export type TableResult = {
  definition: TableDefinition;
  records: ParsedRecord[];
  issues: ValidationIssue[];
  fileStatus: "FOUND" | "MISSING";
};
