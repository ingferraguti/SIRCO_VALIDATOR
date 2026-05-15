import { TableDefinition } from "./types";

const makePlaceholder = (table: TableDefinition["table"], logicalName: string, fileName: string): TableDefinition => ({
  table,
  logicalName,
  fileName,
  recordLength: 17,
  fields: [
    { code: `${table}01`, name: "Azienda", start: 1, end: 3, length: 3, type: "AN", required: true, key: true },
    { code: `${table}02`, name: "Struttura", start: 4, end: 9, length: 6, type: "AN", required: true, key: true },
    { code: `${table}03`, name: "Numero scheda", start: 10, end: 17, length: 8, type: "N", required: true, key: true },
  ],
});

export const tableDefinitions: Record<TableDefinition["table"], TableDefinition> = {
  B: {
    table: "B", logicalName: "Ricoveri", fileName: "Ricoveri20260515.txt", recordLength: 97,
    fields: [
      { code: "B01", name: "Azienda", start: 1, end: 3, length: 3, type: "AN", required: true, key: true },
      { code: "B02", name: "Struttura", start: 4, end: 9, length: 6, type: "AN", required: true, key: true },
      { code: "B03", name: "Numero scheda", start: 10, end: 17, length: 8, type: "N", required: true, key: true },
      { code: "B04", name: "Data ricovero", start: 18, end: 25, length: 8, type: "DT", required: true },
      { code: "B05", name: "Provenienza paziente", start: 26, end: 27, length: 2, type: "AN", required: true, domain: ["01","02","03","04","05","06","07","08","09"] },
      { code: "B06", name: "Proposta ricovero", start: 28, end: 28, length: 1, type: "AN", required: true, domain: ["1","2","3","4","5","6","7","8"] },
      { code: "B07", name: "Cadute in struttura", start: 29, end: 29, length: 1, type: "AN", required: true, domain: ["1","2"] },
      { code: "B08", name: "Data dimissione/decesso", start: 30, end: 37, length: 8, type: "DT", required: true },
      { code: "B09", name: "Giornate assenza temporanea", start: 38, end: 39, length: 2, type: "N", required: true },
      { code: "B10", name: "Filler", start: 40, end: 40, length: 1, type: "AN", filler: true },
      { code: "B11", name: "Segnalazione servizi sociali", start: 41, end: 41, length: 1, type: "AN", required: true, domain: ["1","2"] },
      { code: "B12", name: "Filler", start: 42, end: 42, length: 1, type: "AN", filler: true },
      { code: "B13", name: "Valutazione ADL ingresso", start: 43, end: 45, length: 3, type: "N" },
      { code: "B14", name: "Valutazione ADL dimissione", start: 46, end: 48, length: 3, type: "N" },
      { code: "B15", name: "Tipologia valutazione multidisciplinare", start: 49, end: 50, length: 2, type: "AN", required: true, domain: ["01","02","09"] },
      { code: "B16", name: "Filler", start: 51, end: 60, length: 10, type: "AN", filler: true },
      { code: "B17", name: "Segnalante", start: 61, end: 61, length: 1, type: "AN", domain: ["1","2","3","4","5","9"] },
      { code: "B18", name: "Intervento COT", start: 62, end: 62, length: 1, type: "N", required: true, domain: ["1","2"] },
      { code: "B19", name: "Regione COT", start: 63, end: 65, length: 3, type: "AN" },
      { code: "B20", name: "Azienda COT", start: 66, end: 68, length: 3, type: "AN" },
      { code: "B21", name: "COT", start: 69, end: 74, length: 6, type: "AN" },
      { code: "B22", name: "Data eleggibilità ricovero", start: 75, end: 82, length: 8, type: "DT", required: true },
      { code: "B23", name: "Regione provenienza", start: 83, end: 85, length: 3, type: "AN" },
      { code: "B24", name: "Azienda provenienza", start: 86, end: 88, length: 3, type: "AN" },
      { code: "B25", name: "Struttura provenienza", start: 89, end: 94, length: 6, type: "AN" },
      { code: "B26", name: "Modalità dimissione", start: 95, end: 96, length: 2, type: "AN", required: true, domain: ["01","02","03","04","05","06","07","08","09","10","11"] },
      { code: "B27", name: "Tipo operazione", start: 97, end: 97, length: 1, type: "AN", required: true, domain: ["I","V","C"] },
    ]
  },
  C: makePlaceholder("C", "Motivi Ricovero", "MotiviRicovero20260515.txt"),
  D: makePlaceholder("D", "Diagnosi", "Diagnosi20260515.txt"),
  E: makePlaceholder("E", "Interventi Procedure", "InterventiProcedure20260515.txt"),
  F: makePlaceholder("F", "Problemi socio-sanitari", "Problemisociosanitari20260515.txt"),
  G: makePlaceholder("G", "Lesioni", "Lesioni20260515.txt"),
};
