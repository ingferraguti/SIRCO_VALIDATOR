"use client";
import { useEffect, useMemo, useState } from "react";
import { RecordsGrid } from "./RecordsGrid";
import { TableResult, ValidationIssue } from "@/lib/sirco/types";

export function TableTabs({ tables, jumpTo }: { tables: Record<string, TableResult>; jumpTo: { table: string; line: number; fieldCode?: string } | null }) {
  const tabs = useMemo(() => ["B", "C", "D", "E", "F", "G"], []);
  const [active, setActive] = useState("B");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const activeData = tables[active];

  useEffect(() => {
    if (jumpTo) {
      setActive(jumpTo.table);
      setSelectedLine(jumpTo.line);
    }
  }, [jumpTo]);

  const selectedRecord = activeData?.records.find((r) => r.line === selectedLine);
  const recordIssues = (activeData?.issues ?? []).filter((i: ValidationIssue) => i.line === selectedLine);

  return <div>
    <div className="flex gap-2 mb-3">{tabs.map((t) => <button key={t} onClick={() => setActive(t)} className={`px-3 py-1 rounded border ${active===t?"bg-slate-900 text-white":""}`}>{t} - {tables[t].definition.logicalName}</button>)}</div>
    <RecordsGrid table={active} records={activeData?.records ?? []} issues={activeData?.issues ?? []} selectedLine={selectedLine} onSelectRecord={setSelectedLine} />
    {selectedRecord && <div className="mt-3 rounded border p-3 text-sm space-y-2">
      <h3 className="font-semibold">Dettaglio record</h3>
      <p>Tabella: {selectedRecord.table} - {selectedRecord.tableLogicalName} | Riga: {selectedRecord.line} | Chiave: {selectedRecord.logicalKey} | Lunghezza: {selectedRecord.recordLength}</p>
      <p>Record originale: <code>{selectedRecord.raw}</code></p>
      <p>Visualizzazione spazi: <code>{selectedRecord.raw.replace(/ /g, "·")}</code></p>
      <table className="w-full"><thead><tr><th>Codice</th><th>Nome</th><th>Pos.</th><th>Tipo</th><th>Lung.</th><th>Valore</th><th>Issue</th></tr></thead><tbody>
        {activeData.definition.fields.map((f) => <tr key={f.code} className="border-t"><td>{f.code}</td><td>{f.name}</td><td>{f.start}-{f.end}</td><td>{f.type}</td><td>{f.length}</td><td>{selectedRecord.fields[f.code]}</td><td>{recordIssues.filter((i) => i.fieldCode === f.code).map((i) => i.message).join(" | ") || "-"}</td></tr>)}
      </tbody></table>
    </div>}
  </div>;
}
