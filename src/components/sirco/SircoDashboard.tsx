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
      <div className="overflow-auto rounded border p-2">
        <table className="w-full text-sm">
          <thead><tr><th>Tabella</th><th>File fisico atteso</th><th>Stato file</th><th>Record letti</th><th>Errori</th><th>Warning</th></tr></thead>
          <tbody>
            {Object.entries(data.tables).map(([table, info]: any) => {
              const issues = info.issues ?? [];
              return <tr key={table} className="border-t"><td>{info.logicalName}</td><td>{info.fileName}</td><td>{info.fileFound ? "file trovato" : "file mancante"}</td><td>{info.records.length}</td><td>{issues.filter((i: any) => i.severity === "ERROR").length}</td><td>{issues.filter((i: any) => i.severity === "WARNING").length}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <p>File trovati: {data.summary.filesFound} | File mancanti: {data.summary.filesMissing} | Errori: {data.summary.errors} | Warning: {data.summary.warnings}</p>
      <TableTabs tables={data.tables} />
      <IssuesPanel tables={data.tables} globalIssues={data.globalIssues} />
    </>}
  </div>;
}
