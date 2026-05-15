"use client";
import { useMemo, useState } from "react";
import { RecordsGrid } from "./RecordsGrid";

export function TableTabs({ tables }: { tables: Record<string, any> }) {
  const tabs = useMemo(() => ["A","B","C","D","E","F","G"], []);
  const [active, setActive] = useState("A");
  return <div>
    <div className="flex gap-2 mb-3">{tabs.map((t) => <button key={t} onClick={() => setActive(t)} className={`px-3 py-1 rounded border ${active===t?"bg-slate-900 text-white":""}`}>{t}</button>)}</div>
    <RecordsGrid table={active} data={tables[active]} />
  </div>;
}
