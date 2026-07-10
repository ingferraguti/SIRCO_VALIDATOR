import test from "node:test";
import assert from "node:assert/strict";
import { tableDefinitions } from "../src/lib/sirco/definitions";
import { parseFixedLengthContent, rebuildRecord, setFieldValue } from "../src/lib/sirco/parser";
import { validateTable } from "../src/lib/sirco/validator";
import { validateRelationsWithoutAnagrafica } from "../src/lib/sirco/relational-validator";
import { filterRecords } from "../src/lib/sirco/query";
import { applyBulkEdit, previewBulkEdit, undoChange } from "../src/lib/sirco/bulk-editor";
import { buildExportContent } from "../src/lib/sirco/exporter";
import type { ParsedRecord, SircoTable } from "../src/lib/sirco/types";

const makeRecord = (table: SircoTable, values: Record<string, string>): string => {
  const def = tableDefinitions[table];
  const chars = Array.from({ length: def.recordLength }, () => " ");
  for (const f of def.fields) {
    const value = values[f.code] ?? "";
    const padded = f.type === "N" ? value.padStart(f.length, " ") : value.padEnd(f.length, " ");
    for (let i = 0; i < f.length; i += 1) chars[f.start - 1 + i] = padded[i] ?? " ";
  }
  return chars.join("");
};
const b = (scheda = "26000001") => makeRecord("B", { B01:"101", B02:"000001", B03:scheda, B04:"01012026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B11:"1", B13:"000", B14:"100", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:"1", B27:"I" });
const parsedMap = (records: Partial<Record<SircoTable, ParsedRecord[]>>) => ({ B: [], C: [], D: [], E: [], F: [], G: [], ...records }) as Record<SircoTable, ParsedRecord[]>;

test("parsing 1-based, spazi e zeri iniziali sono conservati", () => {
  const records = parseFixedLengthContent(`${b()}\r\n`, tableDefinitions.B);
  assert.equal(records[0].fields.B03.currentValue, "26000001");
  assert.equal(records[0].fields.B16.currentValue, "          ");
  assert.equal(records[0].fields.B01.currentValue, "101");
});

test("ricostruzione identica all'originale se non modificato", () => {
  const original = b();
  const [record] = parseFixedLengthContent(original, tableDefinitions.B);
  assert.equal(rebuildRecord(record, tableDefinitions.B), original);
});

test("blocca valori troppo lunghi senza troncare", () => {
  const [record] = parseFixedLengthContent(b(), tableDefinitions.B);
  assert.throws(() => setFieldValue(record, tableDefinitions.B, "B17", "12"), /supera/);
});

test("B10 deprecato accetta solo il placeholder spazio in posizione 40", () => {
  const [record] = parseFixedLengthContent(b(), tableDefinitions.B);
  assert.equal(record.fields.B10.currentValue, " ");
  assert.throws(() => setFieldValue(record, tableDefinitions.B, "B10", "X"), /placeholder spazio/);

  const invalid = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"01012026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B10:"X", B11:"1", B13:"000", B14:"100", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:"1", B27:"I" });
  const issues = validateTable(parseFixedLengthContent(invalid, tableDefinitions.B), tableDefinitions.B);
  assert.ok(issues.some((i) => i.code === "INVALID_FILLER" && i.fieldCode === "B10"));
});

test("B12 deprecato accetta solo filler in posizione 42", () => {
  const [record] = parseFixedLengthContent(b(), tableDefinitions.B);
  assert.equal(record.fields.B12.currentValue, " ");

  const invalid = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"01012026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B11:"1", B12:"X", B13:"000", B14:"100", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:"1", B27:"I" });
  const issues = validateTable(parseFixedLengthContent(invalid, tableDefinitions.B), tableDefinitions.B);
  assert.ok(issues.some((i) => i.code === "INVALID_FILLER" && i.fieldCode === "B12"));
});

test("B06 accetta solo i valori ammessi", () => {
  const b06 = tableDefinitions.B.fields.find((field) => field.code === "B06");
  assert.deepEqual(b06?.domain, ["1", "5", "6", "7", "8"]);

  const invalid = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"01012026", B05:"01", B06:"2", B07:"1", B08:"05012026", B09:"00", B11:"1", B13:"000", B14:"100", B15:"09", B17:"1", B18:"2", B22:"01012026", B26:"1", B27:"I" });
  const issues = validateTable(parseFixedLengthContent(invalid, tableDefinitions.B), tableDefinitions.B);
  assert.ok(issues.some((i) => i.code === "INVALID_DOMAIN" && i.fieldCode === "B06"));
  assert.equal(issues.some((i) => i.code === "CROSS_FIELD" && i.fieldCode === "B15" && i.message.includes("B06=2")), false);
});


test("B26 usa lunghezza 2 con filler per valori mon cifra e non ammette 4 o 6", () => {
  const b26 = tableDefinitions.B.fields.find((field) => field.code === "B26");
  assert.deepEqual(b26?.domain, ["1 ", "2 ", "3 ", "5 ", "7 ", "8 ", "9 ", "10", "11"]);

  for (const value of ["1", "2", "3", "5", "7", "8", "9", "10", "11"]) {
    const record = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"01012026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B11:"1", B13:"000", B14:"100", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:value, B27:"I" });
    const issues = validateTable(parseFixedLengthContent(record, tableDefinitions.B), tableDefinitions.B);
    assert.equal(issues.some((i) => i.code === "INVALID_DOMAIN" && i.fieldCode === "B26"), false, value);
  }

  for (const value of ["4", "6", "04", "06", "01"]) {
    const record = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"01012026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B11:"1", B13:"000", B14:"100", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:value, B27:"I" });
    const issues = validateTable(parseFixedLengthContent(record, tableDefinitions.B), tableDefinitions.B);
    assert.ok(issues.some((i) => i.code === "INVALID_DOMAIN" && i.fieldCode === "B26"), value);
  }
});

test("validazione data GGMMAAAA", () => {
  const record = makeRecord("B", { B01:"101", B02:"000001", B03:"26000001", B04:"31022026", B05:"01", B06:"1", B07:"1", B08:"05012026", B09:"00", B11:"1", B15:"01", B17:"1", B18:"2", B22:"01012026", B26:"1", B27:"I" });
  const issues = validateTable(parseFixedLengthContent(record, tableDefinitions.B), tableDefinitions.B);
  assert.ok(issues.some((i) => i.code === "INVALID_DATE" && i.fieldCode === "B04"));
});

test("duplicazione chiavi", () => {
  const issues = validateTable(parseFixedLengthContent(`${b()}\n${b()}`, tableDefinitions.B), tableDefinitions.B);
  assert.ok(issues.some((i) => i.code === "DUPLICATE_KEY"));
});

test("figlio senza Ricovero", () => {
  const c = parseFixedLengthContent(makeRecord("C", { C01:"101", C02:"000001", C03:"26000001", C04:"01", C05:"1" }), tableDefinitions.C);
  const issues = validateRelationsWithoutAnagrafica(parsedMap({ C: c }));
  assert.ok(issues.some((i) => i.code === "MISSING_PARENT"));
});

test("diagnosi senza progressivo 01", () => {
  const br = parseFixedLengthContent(b(), tableDefinitions.B);
  const d = parseFixedLengthContent(makeRecord("D", { D01:"101", D02:"000001", D03:"26000001", D04:"02", D05:"ABC123" }), tableDefinitions.D);
  const issues = validateRelationsWithoutAnagrafica(parsedMap({ B: br, D: d }));
  assert.ok(issues.some((i) => i.message.includes("D04=01")));
});

test("problema F04=00 insieme ad altri problemi", () => {
  const br = parseFixedLengthContent(b(), tableDefinitions.B);
  const f = parseFixedLengthContent(`${makeRecord("F", { F01:"101", F02:"000001", F03:"26000001", F04:"00" })}\n${makeRecord("F", { F01:"101", F02:"000001", F03:"26000001", F04:"01" })}`, tableDefinitions.F);
  const issues = validateRelationsWithoutAnagrafica(parsedMap({ B: br, F: f }));
  assert.ok(issues.some((i) => i.message.includes("F04=00")));
});

test("lesione G05=3 con stadi compilati", () => {
  const g = parseFixedLengthContent(makeRecord("G", { G01:"101", G02:"000001", G03:"26000001", G04:"01", G05:"3", G06:"1", G07:"2" }), tableDefinitions.G);
  const issues = validateTable(g, tableDefinitions.G);
  assert.ok(issues.some((i) => i.code === "CROSS_FIELD"));
});

test("filtro query AND e OR", () => {
  const records = parseFixedLengthContent(`${b("26000001")}\n${b("26000002")}`, tableDefinitions.B);
  assert.equal(filterRecords(records, [], { combinator:"AND", conditions:[{id:"1", fieldCode:"B03", operator:"eq", value:"26000001"},{id:"2", operator:"isNotChanged"}] }).length, 1);
  assert.equal(filterRecords(records, [], { combinator:"OR", conditions:[{id:"1", fieldCode:"B03", operator:"eq", value:"26000001"},{id:"2", fieldCode:"B03", operator:"eq", value:"26000002"}] }).length, 2);
});

test("modifica massiva atomica e undo", () => {
  const records = parseFixedLengthContent(`${b("26000001")}\n${b("26000002")}`, tableDefinitions.B);
  const bad = previewBulkEdit(records, tableDefinitions.B, { table:"B", fieldCode:"B17", action:"set", value:"99", selectedRecordIds:records.map((r)=>r.id) });
  assert.equal(bad.atomic, false);
  const result = applyBulkEdit(records, tableDefinitions.B, { table:"B", fieldCode:"B17", action:"set", value:"2", selectedRecordIds:records.map((r)=>r.id) });
  assert.equal(result.records.every((r)=>r.fields.B17.currentValue === "2"), true);
  assert.equal(undoChange(result.records, tableDefinitions.B, result.changeLogEntry).every((r)=>r.fields.B17.currentValue === "1"), true);
});

test("export con CR-LF", () => {
  const records = parseFixedLengthContent(`${b()}\n`, tableDefinitions.B);
  assert.equal(buildExportContent(records, tableDefinitions.B).endsWith("\r\n"), true);
  assert.equal(buildExportContent(records, tableDefinitions.B).includes("\n"), true);
});
