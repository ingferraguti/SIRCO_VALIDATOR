"use client";
import { useEffect, useMemo, useState } from "react";
import { TableTabs } from "./TableTabs";
import { IssuesPanel } from "./IssuesPanel";
import { TableResult, ValidationIssue } from "@/lib/sirco/types";

type ApiData = {
  tables: Record<string, TableResult>;
  globalIssues: ValidationIssue[];
  summary: { inputDir: string; expectedFiles: number; filesFound: number; filesMissing: number; totalRecords: number; totalErrors: number; totalWarnings: number; validationStatus: string; };
};

export function SircoDashboard() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [jumpTo, setJumpTo] = useState<{ table: string; line: number; fieldCode?: string } | null>(null);

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/sirco/read");
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { void run(); }, []);

  const issues = useMemo(() => data ? [...Object.values(data.tables).flatMap((t) => t.issues), ...data.globalIssues] : [], [data]);
  const exportCsv = () => {
    const header = "severity,table,logicalName,line,key,fieldCode,fieldName,value,message";
    const esc = (v: string | undefined) => `"${(v ?? "").replaceAll('"', '""')}"`;
    const rows = issues.map((i) => [i.severity, i.table, i.logicalName, String(i.line), i.key ?? "", i.fieldCode ?? "", i.fieldName ?? "", i.value ?? "", i.message].map(esc).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sirco-validation-report.csv"; a.click();
  };

  return <div className="space-y-4 p-6">
    <h1 className="text-2xl font-bold">sirco-validator</h1>
    <p>Cartella input: <code>{data?.summary.inputDir ?? "/data/input"}</code></p>
    <p className="text-sm">I file devono essere copiati manualmente nella cartella /data/input del progetto. In questa versione non è previsto upload da interfaccia.</p>
    <div className="flex gap-2"><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={run}>{loading ? "Validazione..." : "Esegui validazione"}</button><button className="rounded bg-emerald-600 px-4 py-2 text-white" onClick={exportCsv} disabled={!data}>Esporta report errori CSV</button></div>
    {data && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="rounded border p-2">File attesi: {data.summary.expectedFiles}</div><div className="rounded border p-2">File trovati: {data.summary.filesFound}</div><div className="rounded border p-2">File mancanti: {data.summary.filesMissing}</div><div className="rounded border p-2">Record totali: {data.summary.totalRecords}</div><div className="rounded border p-2">Errori: {data.summary.totalErrors}</div><div className="rounded border p-2">Warning: {data.summary.totalWarnings}</div><div className="rounded border p-2">Stato: {data.summary.validationStatus}</div>
      </div>
      <table className="w-full text-sm rounded border"><thead><tr><th>Tabella</th><th>Nome logico</th><th>Nome file atteso</th><th>Stato file</th><th>Numero record</th><th>Errori</th><th>Warning</th></tr></thead><tbody>{Object.values(data.tables).map((t) => <tr key={t.definition.table} className="border-t"><td>{t.definition.table}</td><td>{t.definition.logicalName}</td><td>{t.definition.fileName}</td><td>{t.fileStatus}</td><td>{t.records.length}</td><td>{t.issues.filter((i)=>i.severity==="ERROR").length}</td><td>{t.issues.filter((i)=>i.severity==="WARNING").length}</td></tr>)}</tbody></table>
      <TableTabs tables={data.tables} jumpTo={jumpTo} />
      <IssuesPanel issues={issues} onSelectIssue={(i) => setJumpTo({ table: i.table, line: i.line, fieldCode: i.fieldCode })} />
    </>}
  </div>;
}
