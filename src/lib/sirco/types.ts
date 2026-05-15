export type SircoTable = "A" | "B" | "C" | "D" | "E" | "F" | "G";

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
  fileName: string;
  recordLength: number;
  fields: FieldDefinition[];
};

export type ParsedRecord = {
  table: SircoTable;
  line: number;
  raw: string;
  recordLength: number;
  fields: Record<string, string>;
  logicalKey: string;
};

export type ValidationIssue = {
  severity: "ERROR" | "WARNING";
  table: string;
  line: number;
  fieldCode?: string;
  fieldName?: string;
  message: string;
  value?: string;
};

export type TableResult = {
  records: ParsedRecord[];
  issues: ValidationIssue[];
  fileStatus: "FOUND" | "MISSING";
};
