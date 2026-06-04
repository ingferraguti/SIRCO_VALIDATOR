export type SircoTable = "B" | "C" | "D" | "E" | "F" | "G";
export type FieldType = "AN" | "N" | "DT";
export type ValidationSeverity = "ERROR" | "WARNING" | "INFO";

export type FieldDefinition = {
  code: string;
  name: string;
  start: number;
  end: number;
  length: number;
  type: FieldType;
  key?: boolean;
  required?: boolean;
  requiredSeverity?: ValidationSeverity;
  filler?: boolean;
  domain?: readonly string[];
  externalDomainCode?: string;
  description?: string;
};

export type TableDefinition = {
  table: SircoTable;
  logicalName: string;
  filePattern: string;
  fileName?: string;
  recordLength: number;
  fields: readonly FieldDefinition[];
  primaryKeyFields: readonly string[];
  parentTable?: "B";
};

export type EditableFieldValue = { originalValue: string; currentValue: string; changed: boolean };

export type ParsedRecord = {
  id: string;
  table: SircoTable;
  line: number;
  originalRecord: string;
  currentRecord: string;
  originalLength: number;
  currentLength: number;
  relationKey: string;
  primaryKey: string;
  fields: Record<string, EditableFieldValue>;
  changed: boolean;
  raw: string;
  recordLength: number;
  logicalKey: string;
};

export type ValidationIssueCode =
  | "RECORD_LENGTH" | "REQUIRED" | "INVALID_NUMERIC" | "INVALID_DATE" | "INVALID_DOMAIN" | "INVALID_FILLER"
  | "INVALID_ALIGNMENT" | "DUPLICATE_KEY" | "MISSING_PARENT" | "CARDINALITY" | "CROSS_FIELD"
  | "EXTERNAL_DOMAIN_NOT_CHECKED" | "DATABASE_CONTROL_NOT_CHECKED" | "VALUE_TOO_LONG" | "INVALID_CHARACTERS";

export type ValidationIssue = {
  id: string;
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  table: SircoTable | string;
  logicalName: string;
  line?: number;
  recordId?: string;
  relationKey?: string;
  primaryKey?: string;
  key?: string;
  fieldCode?: string;
  fieldName?: string;
  value?: string;
  message: string;
};

export type TableResult = {
  table: SircoTable;
  logicalName: string;
  fileName: string;
  filePattern: string;
  fileFound: boolean;
  records: ParsedRecord[];
  issues: ValidationIssue[];
  fileStatus: "FOUND" | "MISSING" | "CONFIG_ERROR";
};

export type ValidationContext = {
  referenceYear?: number;
  submissionNumber?: 1 | 2 | 3 | 4 | 5;
  processingPeriodStart?: string;
  processingPeriodEnd?: string;
  senderCompanyCode?: string;
};

export type QueryOperator = "eq" | "neq" | "contains" | "notContains" | "startsWith" | "endsWith" | "isEmpty" | "isNotEmpty" | "in" | "notIn" | "gt" | "lt" | "gte" | "lte" | "hasError" | "hasWarning" | "hasIssueCode" | "isChanged" | "isNotChanged";
export type QueryCondition = { id: string; fieldCode?: string; operator: QueryOperator; value?: string };
export type QueryGroup = { combinator: "AND" | "OR"; conditions: QueryCondition[] };

export type BulkAction = "set" | "clear" | "copy" | "replace" | "prefix" | "suffix" | "normalizeAlignment" | "restoreOriginal";
export type ChangeLogEntry = { id: string; timestamp: string; mode: "SINGLE" | "BULK"; table: SircoTable; fieldCode: string; affectedRecordIds: string[]; previousValues: Record<string, string>; newValues: Record<string, string>; description: string };
