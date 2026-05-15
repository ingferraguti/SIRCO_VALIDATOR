"use client";
import { useMemo, useState } from "react";

export function IssuesPanel({ tables, globalIssues }: { tables: Record<string, any>; globalIssues: any[] }) {
  const [sev, setSev] = useState("ALL");
  const [table, setTable] = useState("ALL");
  const list = useMemo(() => [...Object.values(tables).flatMap((t: any) => t.issues), ...globalIssues], [tables, globalIssues]);
  const filtered = list.filter((i: any) => (sev === "ALL" || i.severity === sev) && (table === "ALL" || i.table === table));
  return <div className="rounded border p-3 space-y-2">
    <h2 className="font-semibold">Segnalazioni ({filtered.length})</h2>
    <div className="flex gap-2"><select value={sev} onChange={(e)=>setSev(e.target.value)}><option>ALL</option><option>ERROR</option><option>WARNING</option></select>
    <select value={table} onChange={(e)=>setTable(e.target.value)}><option>ALL</option>{["B","C","D","E","F","G"].map(t => <option key={t}>{t}</option>)}</select></div>
    <table className="w-full text-sm"><thead><tr><th>Gravità</th><th>Tabella</th><th>Riga</th><th>Campo</th><th>Valore</th><th>Messaggio</th></tr></thead><tbody>
      {filtered.map((i: any, idx: number) => <tr key={idx} className="border-t"><td>{i.severity}</td><td>{i.table}</td><td>{i.line}</td><td>{i.fieldCode ?? "-"}</td><td>{i.value ?? "-"}</td><td>{i.message}</td></tr>)}
    </tbody></table>
  </div>;
}
