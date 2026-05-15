import { TableDefinition } from "./types";

const makePlaceholder = (table: TableDefinition["table"]): TableDefinition => ({
  table,
  fileName: `${table}.txt`,
  recordLength: 1,
  fields: [{ code: `${table}01`, name: "Placeholder", start: 1, end: 1, length: 1, type: "AN" }],
});

export const tableDefinitions: Record<TableDefinition["table"], TableDefinition> = {
  A: {
    table: "A", fileName: "A.txt", recordLength: 120,
    fields: [
      { code: "A01", name: "Azienda", start: 1, end: 3, length: 3, type: "AN", required: true, key: true },
      { code: "A02", name: "Struttura", start: 4, end: 9, length: 6, type: "AN", required: true, key: true },
      { code: "A03", name: "Numero scheda", start: 10, end: 17, length: 8, type: "N", required: true, key: true },
      { code: "A04", name: "Nome assistito", start: 18, end: 37, length: 20, type: "AN" },
      { code: "A05", name: "Cognome assistito", start: 38, end: 67, length: 30, type: "AN" },
      { code: "A06", name: "Sesso", start: 68, end: 68, length: 1, type: "AN", required: true, domain: ["1", "2"] },
      { code: "A07", name: "Data di nascita", start: 69, end: 76, length: 8, type: "DT", required: true },
      { code: "A08", name: "Comune di nascita", start: 77, end: 82, length: 6, type: "AN", required: true },
      { code: "A09", name: "Comune di residenza", start: 83, end: 88, length: 6, type: "AN", required: true },
      { code: "A10", name: "Cittadinanza", start: 89, end: 91, length: 3, type: "AN", required: true },
      { code: "A11", name: "Codice Fiscale", start: 92, end: 107, length: 16, type: "AN" },
      { code: "A12", name: "Stato civile", start: 108, end: 108, length: 1, type: "AN", required: true, domain: ["1","2","3","4","5","6","7","8","9"] },
      { code: "A13", name: "Livello di istruzione", start: 109, end: 109, length: 1, type: "AN", required: true, domain: ["0","1","2","3","4","5","9"] },
      { code: "A14", name: "Filler", start: 110, end: 120, length: 11, type: "AN", filler: true },
    ]
  },
  B: {
    table: "B", fileName: "B.txt", recordLength: 97,
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
  C: makePlaceholder("C"), D: makePlaceholder("D"), E: makePlaceholder("E"), F: makePlaceholder("F"), G: makePlaceholder("G"),
};
