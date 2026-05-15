"use client";
import { useMemo, useState } from "react";
import { RecordsGrid } from "./RecordsGrid";

const LABELS: Record<string, string> = {
  B: "Ricoveri",
  C: "Motivi Ricovero",
  D: "Diagnosi",
  E: "Interventi Procedure",
  F: "Problemi socio-sanitari",
  G: "Lesioni",
};

export function TableTabs({ tables }: { tables: Record<string, any> }) {
  const tabs = useMemo(() => ["B", "C", "D", "E", "F", "G"], []);
  const [active, setActive] = useState("B");
  return <div>
    <div className="flex gap-2 mb-3 flex-wrap">{tabs.map((t) => <button key={t} onClick={() => setActive(t)} className={`px-3 py-1 rounded border ${active===t?"bg-slate-900 text-white":""}`}>{LABELS[t]}</button>)}</div>
    <RecordsGrid table={active} data={tables[active]} />
  </div>;
}
