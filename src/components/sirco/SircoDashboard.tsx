"use client";
import { useEffect, useState } from "react";
import { TableTabs } from "./TableTabs";
import { IssuesPanel } from "./IssuesPanel";

export function SircoDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/sirco/read");
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  return <div className="space-y-4 p-6">
    <h1 className="text-2xl font-bold">SIRCO Validator MVP</h1>
    <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={run}>{loading ? "Validazione..." : "Esegui validazione"}</button>
    {data && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.entries(data.summary.records).map(([k,v]) => <div key={k} className="rounded border p-2">Tabella {k}: {String(v)} record</div>)}</div>
      <p>File trovati: {data.summary.filesFound} | Errori: {data.summary.errors} | Warning: {data.summary.warnings}</p>
      <TableTabs tables={data.tables} />
      <IssuesPanel tables={data.tables} globalIssues={data.globalIssues} />
    </>}
  </div>;
}
