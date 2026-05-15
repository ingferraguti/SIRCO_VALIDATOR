"use client";
import { useMemo, useState } from "react";
import { ValidationIssue } from "@/lib/sirco/types";

const tableOptions = ["ALL", "B", "C", "D", "E", "F", "G"];

export function IssuesPanel({ issues, onSelectIssue }: { issues: ValidationIssue[]; onSelectIssue: (issue: ValidationIssue) => void }) {
  const [sev, setSev] = useState("ALL");
  const [table, setTable] = useState("ALL");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => issues.filter((i) => {
    const hay = `${i.key ?? ""} ${i.fieldCode ?? ""} ${i.message} ${i.value ?? ""}`.toLowerCase();
    return (sev === "ALL" || i.severity === sev) && (table === "ALL" || i.table === table) && (!query || hay.includes(query.toLowerCase()));
  }), [issues, sev, table, query]);

  return <div className="rounded border p-3 space-y-2">
    <h2 className="font-semibold">Segnalazioni ({filtered.length})</h2>
    <div className="flex gap-2">
      <select value={sev} onChange={(e)=>setSev(e.target.value)}><option value="ALL">tutte le gravità</option><option value="ERROR">solo ERROR</option><option value="WARNING">solo WARNING</option></select>
      <select value={table} onChange={(e)=>setTable(e.target.value)}>{tableOptions.map((t) => <option key={t} value={t}>{t === "ALL" ? "tutte le tabelle" : t}</option>)}</select>
      <input className="border rounded px-2" placeholder="Ricerca libera" value={query} onChange={(e) => setQuery(e.target.value)} />
    </div>
    <table className="w-full text-sm"><thead><tr><th>Gravità</th><th>Tabella</th><th>Nome tabella</th><th>Riga</th><th>Campo</th><th>Nome campo</th><th>Valore</th><th>Messaggio</th></tr></thead><tbody>
      {filtered.map((i, idx) => <tr key={`${i.table}-${i.line}-${idx}`} onClick={() => onSelectIssue(i)} className="border-t cursor-pointer hover:bg-slate-50"><td>{i.severity}</td><td>{i.table}</td><td>{i.logicalName}</td><td>{i.line}</td><td>{i.fieldCode ?? "-"}</td><td>{i.fieldName ?? "-"}</td><td>{i.value ?? "-"}</td><td>{i.message}</td></tr>)}
    </tbody></table>
  </div>;
}
