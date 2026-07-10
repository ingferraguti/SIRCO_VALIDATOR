import { FieldDefinition, SircoTable, TableDefinition } from "./types";

export const SIRCO_FILE_MAP: Record<SircoTable, { logicalName: string; filePattern: string }> = {
  B: { logicalName: "Ricoveri", filePattern: "Ricoveri*.txt" },
  C: { logicalName: "Motivi Ricovero", filePattern: "MotiviRicovero*.txt" },
  D: { logicalName: "Diagnosi", filePattern: "Diagnosi*.txt" },
  E: { logicalName: "Interventi Procedure", filePattern: "InterventiProcedure*.txt" },
  F: { logicalName: "Problemi socio-sanitari", filePattern: "Problemisociosanitari*.txt" },
  G: { logicalName: "Lesioni", filePattern: "Lesioni*.txt" },
};

const baseFields = (table: SircoTable): FieldDefinition[] => [
  { code: `${table}01`, name: "Azienda", start: 1, end: 3, length: 3, type: "AN", required: true, key: true, externalDomainCode: "aziende" },
  { code: `${table}02`, name: "Struttura", start: 4, end: 9, length: 6, type: "AN", required: true, key: true, externalDomainCode: "strutture-sirco" },
  { code: `${table}03`, name: "Numero scheda", start: 10, end: 17, length: 8, type: "N", required: true, key: true },
];

const child = (table: SircoTable, keyName: string, keyDomain?: readonly string[], rest: FieldDefinition[] = []): TableDefinition => ({
  table,
  logicalName: SIRCO_FILE_MAP[table].logicalName,
  filePattern: SIRCO_FILE_MAP[table].filePattern,
  recordLength: Math.max(19, ...rest.map((f) => f.end)),
  primaryKeyFields: [`${table}01`, `${table}02`, `${table}03`, `${table}04`],
  parentTable: "B",
  fields: [
    ...baseFields(table),
    { code: `${table}04`, name: keyName, start: 18, end: 19, length: 2, type: "AN", required: true, key: true, domain: keyDomain },
    ...rest,
  ],
});

const range = (from: number, to: number, width: number): string[] => Array.from({ length: to - from + 1 }, (_, i) => String(from + i).padStart(width, "0"));

export const tableDefinitions: Record<SircoTable, TableDefinition> = {
  B: {
    table: "B", logicalName: SIRCO_FILE_MAP.B.logicalName, filePattern: SIRCO_FILE_MAP.B.filePattern, recordLength: 97,
    primaryKeyFields: ["B01", "B02", "B03"],
    fields: [
      ...baseFields("B"),
      { code: "B04", name: "Data ricovero", start: 18, end: 25, length: 8, type: "DT", required: true },
      { code: "B05", name: "Provenienza paziente", start: 26, end: 27, length: 2, type: "AN", required: true, domain: range(1, 9, 2) },
      { code: "B06", name: "Proposta ricovero", start: 28, end: 28, length: 1, type: "AN", required: true, domain: ["1","2","3","4","5","6","7","8"] },
      { code: "B07", name: "Cadute in struttura", start: 29, end: 29, length: 1, type: "AN", required: true, domain: ["1","2"] },
      { code: "B08", name: "Data dimissione/decesso", start: 30, end: 37, length: 8, type: "DT", required: true },
      { code: "B09", name: "Giornate assenza temporanea", start: 38, end: 39, length: 2, type: "N", required: true },
      { code: "B10", name: "Placeholder B10 deprecato", start: 40, end: 40, length: 1, type: "AN", filler: true, placeholder: true, description: "Campo B10 deprecato: alla posizione 40 è ammesso solo il placeholder spazio." },
      { code: "B11", name: "Segnalazione servizi sociali", start: 41, end: 41, length: 1, type: "AN", required: true, domain: ["1","2"] },
      { code: "B12", name: "Filler", start: 42, end: 42, length: 1, type: "AN", filler: true },
      { code: "B13", name: "Valutazione ADL ingresso", start: 43, end: 45, length: 3, type: "N" },
      { code: "B14", name: "Valutazione ADL dimissione", start: 46, end: 48, length: 3, type: "N" },
      { code: "B15", name: "Tipologia valutazione multidisciplinare", start: 49, end: 50, length: 2, type: "AN", required: true, domain: ["01","02","09"] },
      { code: "B16", name: "Filler", start: 51, end: 60, length: 10, type: "AN", filler: true },
      { code: "B17", name: "Segnalante", start: 61, end: 61, length: 1, type: "AN", required: true, requiredSeverity: "WARNING", domain: ["1","2","3","4","5","9"] },
      { code: "B18", name: "Intervento COT", start: 62, end: 62, length: 1, type: "N", required: true, domain: ["1","2"] },
      { code: "B19", name: "Regione COT", start: 63, end: 65, length: 3, type: "AN", externalDomainCode: "regioni" },
      { code: "B20", name: "Azienda COT", start: 66, end: 68, length: 3, type: "AN", externalDomainCode: "aziende" },
      { code: "B21", name: "COT", start: 69, end: 74, length: 6, type: "AN", externalDomainCode: "strutture-sirco" },
      { code: "B22", name: "Data eleggibilità ricovero", start: 75, end: 82, length: 8, type: "DT", required: true },
      { code: "B23", name: "Regione provenienza", start: 83, end: 85, length: 3, type: "AN", externalDomainCode: "regioni" },
      { code: "B24", name: "Azienda provenienza", start: 86, end: 88, length: 3, type: "AN", externalDomainCode: "aziende" },
      { code: "B25", name: "Struttura provenienza", start: 89, end: 94, length: 6, type: "AN", externalDomainCode: "strutture-sirco" },
      { code: "B26", name: "Modalità dimissione", start: 95, end: 96, length: 2, type: "AN", required: true, domain: range(1, 11, 2) },
      { code: "B27", name: "Tipo operazione", start: 97, end: 97, length: 1, type: "AN", required: true, domain: ["I","V","C"], description: "Controlli I/V/C su banca dati regionale non verificabili localmente." },
    ],
  },
  C: child("C", "Motivo ricovero", ["01","02","03","04","05","06","07","08","99"], [
    { code: "C05", name: "Motivo principale", start: 20, end: 20, length: 1, type: "AN", domain: ["1"] },
    { code: "C06", name: "Filler", start: 21, end: 40, length: 20, type: "AN", filler: true },
  ]),
  D: child("D", "Progressivo diagnosi", range(1, 10, 2), [
    { code: "D05", name: "Codice diagnosi", start: 20, end: 24, length: 5, type: "AN", required: true, externalDomainCode: "diagnosi" },
    { code: "D06", name: "Filler", start: 25, end: 40, length: 16, type: "AN", filler: true },
  ]),
  E: child("E", "Progressivo intervento", range(1, 15, 2), [
    { code: "E05", name: "Codice intervento/procedura", start: 20, end: 23, length: 4, type: "AN", required: true, externalDomainCode: "procedure" },
    { code: "E06", name: "Data intervento/procedura", start: 24, end: 31, length: 8, type: "DT", required: true },
    { code: "E07", name: "Filler", start: 32, end: 50, length: 19, type: "AN", filler: true, description: "Specifiche v2.0: filler da posizione 32 a 50." },
  ]),
  F: child("F", "Problema socio-familiare", range(0, 10, 2), [
    { code: "F05", name: "Filler", start: 20, end: 40, length: 21, type: "AN", filler: true },
  ]),
  G: child("G", "Progressivo lesione", range(1, 99, 2), [
    { code: "G05", name: "Tipologia lesione", start: 20, end: 20, length: 1, type: "AN", required: true, domain: ["1","2","3"] },
    { code: "G06", name: "Stadio iniziale", start: 21, end: 22, length: 2, type: "AN", domain: ["01","02","03","04","05"] },
    { code: "G07", name: "Stadio alla dimissione", start: 23, end: 24, length: 2, type: "AN", domain: ["00","01","02","03","04","05"] },
    { code: "G08", name: "Filler", start: 25, end: 40, length: 16, type: "AN", filler: true },
  ]),
};

export const relationKeyFields = (table: SircoTable): readonly string[] => [`${table}01`, `${table}02`, `${table}03`];

export const protectedFieldCodes = new Set(["B01","B02","B03","C01","C02","C03","C04","D01","D02","D03","D04","E01","E02","E03","E04","F01","F02","F03","F04","G01","G02","G03","G04"]);
