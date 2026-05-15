"use client";
import { useEffect, useMemo, useState } from "react";
import { tableDefinitions } from "@/lib/sirco/definitions";

type Severity = "ERROR" | "WARNING";
type Issue = { severity: Severity; table: string; logicalName: string; line: number; key?: string; fieldCode?: string; fieldName?: string; value?: string; message: string };

export function SircoDashboard() {
  const [data, setData] = useState<any>(null);
  const [activeTable, setActiveTable] = useState("B");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [tableFilter, setTableFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const run = async () => setData(await (await fetch("/api/sirco/read")).json());
  useEffect(() => void run(), []);

  const issues: Issue[] = useMemo(() => data ? [...Object.values(data.tables).flatMap((t: any) => t.issues), ...data.globalIssues] : [], [data]);
  const filteredIssues = useMemo(() => issues.filter((i) => (severityFilter === "ALL" || i.severity === severityFilter) && (tableFilter === "ALL" || i.table === tableFilter) && [i.key, i.fieldCode, i.fieldName, i.message, i.value].join(" ").toLowerCase().includes(search.toLowerCase())), [issues, severityFilter, tableFilter, search]);

  const selectedRecord = useMemo(() => data?.tables?.[activeTable]?.records?.find((r: any) => r.line === selectedLine), [data, activeTable, selectedLine]);

  const onIssueClick = (issue: Issue) => { setActiveTable(issue.table); setSelectedLine(issue.line > 0 ? issue.line : null); setSelectedField(issue.fieldCode ?? null); };
  const exportCsv = () => {
    const header = ["severity","table","logicalName","line","key","fieldCode","fieldName","value","message"];
    const rows = issues.map((i) => [i.severity, i.table, i.logicalName, String(i.line), i.key ?? "", i.fieldCode ?? "", i.fieldName ?? "", i.value ?? "", i.message].map((v) => `"${v.replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sirco-validation-report.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  if (!data) return <div className="p-6">Caricamento...</div>;
  return <div className="space-y-4 p-6 text-sm">
    <h1 className="text-2xl font-bold">sirco-validator</h1>
    <p>Cartella input: <b>{data.inputDir}</b></p>
    <p>I file devono essere copiati manualmente nella cartella /data/input del progetto. In questa versione non è previsto upload da interfaccia.</p>
    <button className="rounded bg-blue-600 px-4 py-2 text-white mr-2" onClick={run}>Esegui validazione</button>
    <button className="rounded bg-emerald-700 px-4 py-2 text-white" onClick={exportCsv}>Esporta report errori CSV</button>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.entries(data.summary).map(([k,v]) => <div key={k} className="border rounded p-2"><b>{k}</b><div>{String(v)}</div></div>)}</div>

    <table className="w-full border"><thead><tr><th>Tabella</th><th>Nome logico</th><th>Nome file atteso</th><th>Stato file</th><th>Numero record</th><th>Errori</th><th>Warning</th></tr></thead><tbody>
      {Object.values(data.tables).map((info: any) => <tr key={info.table} className="border-t"><td>{info.table}</td><td>{info.logicalName}</td><td>{info.fileName}</td><td className={info.table==="B" && !info.fileFound ? "text-red-700 font-bold" : ""}>{info.fileFound ? "trovato" : "mancante"}</td><td>{info.records.length}</td><td>{info.issues.filter((i: Issue)=>i.severity==="ERROR").length}</td><td>{info.issues.filter((i: Issue)=>i.severity==="WARNING").length}</td></tr>)}
    </tbody></table>

    <div className="space-y-2 border rounded p-3"><h2 className="font-semibold">IssuesPanel</h2>
      <div className="flex gap-2 flex-wrap"><select value={severityFilter} onChange={(e)=>setSeverityFilter(e.target.value)}><option value="ALL">tutte le gravità</option><option>ERROR</option><option>WARNING</option></select>
      <select value={tableFilter} onChange={(e)=>setTableFilter(e.target.value)}><option value="ALL">tutte le tabelle</option>{Object.keys(tableDefinitions).map((t)=> <option key={t} value={t}>{data.tables[t].logicalName}</option>)}</select>
      <input className="border px-2" placeholder="ricerca libera" value={search} onChange={(e)=>setSearch(e.target.value)} /></div>
      <table className="w-full"><thead><tr><th>Gravità</th><th>Tabella</th><th>Nome tabella</th><th>Riga</th><th>Campo</th><th>Nome campo</th><th>Valore</th><th>Messaggio</th></tr></thead><tbody>
        {filteredIssues.map((i, idx) => <tr key={idx} className="border-t cursor-pointer" onClick={()=>onIssueClick(i)}><td>{i.severity}</td><td>{i.table}</td><td>{i.logicalName}</td><td>{i.line}</td><td>{i.fieldCode ?? "-"}</td><td>{i.fieldName ?? "-"}</td><td>{i.value ?? "-"}</td><td>{i.message}</td></tr>)}
      </tbody></table>
    </div>

    <div className="flex gap-2 flex-wrap">{Object.keys(tableDefinitions).map((t)=><button key={t} className={`px-3 py-1 border rounded ${activeTable===t?"bg-black text-white":""}`} onClick={()=>setActiveTable(t)}>{data.tables[t].logicalName}</button>)}</div>
    <table className="w-full border"><thead><tr><th>Riga</th><th>Chiave</th>{data.tables[activeTable].records[0] && Object.keys(data.tables[activeTable].records[0].fields).map((f:string)=><th key={f}>{f}</th>)}</tr></thead><tbody>
      {data.tables[activeTable].records.map((r:any)=> <tr key={r.line} className={`border-t cursor-pointer ${selectedLine===r.line?"bg-yellow-100":""}`} onClick={()=>setSelectedLine(r.line)}><td>{r.line}</td><td>{r.logicalKey}</td>{Object.keys(r.fields).map((f: string)=> <td key={f} className={selectedField===f && selectedLine===r.line ? "bg-red-100" : ""}>{r.fields[f]}</td>)}</tr>)}
    </tbody></table>

    {selectedRecord && <div className="border rounded p-3"><h3 className="font-semibold">Dettaglio record</h3>
      <p>tabella: {selectedRecord.table} ({data.tables[selectedRecord.table].logicalName}) - riga {selectedRecord.line}</p>
      <p>chiave: {selectedRecord.logicalKey}</p><p>lunghezza: {selectedRecord.recordLength}</p>
      <p>record originale: <code>{selectedRecord.raw}</code></p>
      <p>record visuale: <code>{selectedRecord.raw.replaceAll(" ", "·")}</code></p>
      <table className="w-full"><thead><tr><th>codice</th><th>nome</th><th>start</th><th>end</th><th>tipo</th><th>len</th><th>valore</th><th>issue</th></tr></thead><tbody>
      {tableDefinitions[selectedRecord.table as keyof typeof tableDefinitions].fields.map((f)=>{const fieldIssues = issues.filter((i)=>i.table===selectedRecord.table&&i.line===selectedRecord.line&&i.fieldCode===f.code);return <tr key={f.code} className="border-t"><td>{f.code}</td><td>{f.name}</td><td>{f.start}</td><td>{f.end}</td><td>{f.type}</td><td>{f.length}</td><td>{selectedRecord.fields[f.code]}</td><td>{fieldIssues.map((x)=>`${x.severity}: ${x.message}`).join(" | ") || "-"}</td></tr>;})}
      </tbody></table></div>}
  </div>;
}
