"use client";
import { useEffect, useMemo, useState } from "react";
import { tableDefinitions, protectedFieldCodes } from "@/lib/sirco/definitions";
import { applyBulkEdit, previewBulkEdit, type BulkEditRequest, type BulkPreview } from "@/lib/sirco/bulk-editor";
import { filterRecords } from "@/lib/sirco/query";
import { setFieldValue, restoreField, restoreRecord } from "@/lib/sirco/parser";
import type { ChangeLogEntry, ParsedRecord, QueryGroup, SircoTable, TableResult, ValidationIssue } from "@/lib/sirco/types";

type ApiData = { inputDir: string; outputDir: string; exportMessage: string; tables: Record<SircoTable, TableResult>; globalIssues: ValidationIssue[]; summary: Record<string, string | number> };
const tables = Object.keys(tableDefinitions) as SircoTable[];
const emptyQuery: QueryGroup = { combinator: "AND", conditions: [{ id: "c1", operator: "isNotChanged" }] };

export function SircoDashboard() {
  const [data, setData] = useState<ApiData | null>(null);
  const [activeTable, setActiveTable] = useState<SircoTable>("B");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [query, setQuery] = useState<QueryGroup>(emptyQuery);
  const [bulkField, setBulkField] = useState("B17");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkAction, setBulkAction] = useState<BulkEditRequest["action"]>("set");
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [message, setMessage] = useState("");

  const run = async () => { const json = await (await fetch("/api/sirco/read")).json() as ApiData; setData(json); setSelectedIds(new Set()); setSelectedRecordId(null); };
  useEffect(() => { void run(); }, []);

  const issues = useMemo(() => data ? [...Object.values(data.tables).flatMap((t) => t.issues), ...data.globalIssues] : [], [data]);
  const activeRecords = data?.tables[activeTable].records ?? [];
  const filteredRecords = useMemo(() => filterRecords(activeRecords, issues, query), [activeRecords, issues, query]);
  const selectedRecord = activeRecords.find((r) => r.id === selectedRecordId) ?? null;
  const filteredIssues = issues.filter((i) => severityFilter === "ALL" || i.severity === severityFilter);
  const modifiedCount = Object.values(data?.tables ?? {}).flatMap((t) => t.records).filter((r) => r.changed).length;

  const updateRecord = (record: ParsedRecord) => {
    if (!data) return;
    setData({ ...data, tables: { ...data.tables, [record.table]: { ...data.tables[record.table], records: data.tables[record.table].records.map((r) => r.id === record.id ? record : r) } } });
  };
  const onFieldChange = (record: ParsedRecord, fieldCode: string, value: string) => { try { updateRecord(setFieldValue(record, tableDefinitions[record.table], fieldCode, value)); setMessage("Modifica applicata in memoria: rivalidare per aggiornare tutte le segnalazioni."); } catch (err) { setMessage(err instanceof Error ? err.message : "Modifica non applicabile"); } };
  const applyBulk = () => {
    if (!data) return;
    const request: BulkEditRequest = { table: activeTable, fieldCode: bulkField, action: bulkAction, value: bulkValue, selectedRecordIds: [...selectedIds] };
    try { const result = applyBulkEdit(activeRecords, tableDefinitions[activeTable], request); setData({ ...data, tables: { ...data.tables, [activeTable]: { ...data.tables[activeTable], records: result.records } } }); setChangeLog((log) => [result.changeLogEntry, ...log]); setBulkPreview(result.preview); setMessage(`Applicata modifica atomica a ${result.preview.affectedCount} record.`); } catch (err) { setBulkPreview(previewBulkEdit(activeRecords, tableDefinitions[activeTable], request)); setMessage(err instanceof Error ? err.message : "Modifica massiva non applicabile"); }
  };
  const undoLast = () => { const [last, ...rest] = changeLog; if (!last || !data) return; const definition = tableDefinitions[last.table]; const records = data.tables[last.table].records; let next = records; for (const record of records) if (last.previousValues[record.id] !== undefined) next = next.map((item) => item.id === record.id ? setFieldValue(item, definition, last.fieldCode, last.previousValues[record.id]) : item); setData({ ...data, tables: { ...data.tables, [last.table]: { ...data.tables[last.table], records: next } } }); setChangeLog(rest); };
  const restoreAll = () => { if (!data) return; const nextTables = Object.fromEntries(tables.map((t) => [t, { ...data.tables[t], records: data.tables[t].records.map(restoreRecord) }])) as Record<SircoTable, TableResult>; setData({ ...data, tables: nextTables }); setChangeLog([]); };
  const toggleSelected = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  if (!data) return <div className="p-6">Caricamento...</div>;
  return <div className="space-y-6 p-6 text-sm">
    <header><h1 className="text-2xl font-bold">sirco-validator</h1><p>Cartella input: <b>{data.inputDir}</b> · Cartella output: <b>{data.outputDir}</b></p><p className="font-semibold text-emerald-800">{data.exportMessage}</p><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={run}>Esegui validazione / ricarica originali</button>{message && <p className="mt-2 text-blue-800">{message}</p>}</header>

    <section className="space-y-2"><h2 className="text-xl font-semibold">Dashboard</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.entries(data.summary).map(([k,v]) => <div key={k} className="border rounded p-2"><b>{k}</b><div>{String(v)}</div></div>)}<div className="border rounded p-2"><b>record modificati</b><div>{modifiedCount}</div></div></div></section>

    <section className="space-y-2"><h2 className="text-xl font-semibold">Record</h2><div className="flex gap-2 flex-wrap">{tables.map((t)=><button key={t} className={`px-3 py-1 border rounded ${activeTable===t?"bg-black text-white":""}`} onClick={()=>{setActiveTable(t); setBulkField(`${t}05`);}}>{data.tables[t].logicalName}</button>)}</div>
      <table className="w-full border"><thead><tr><th>Sel.</th><th>Riga</th><th>Chiave</th><th>Stato</th><th>Errori</th><th>Warning</th><th>Mod.</th>{tableDefinitions[activeTable].fields.slice(0, 8).map((f)=><th key={f.code}>{f.code}</th>)}</tr></thead><tbody>{activeRecords.map((r)=>{const recIssues=issues.filter((i)=>i.recordId===r.id||(i.table===r.table&&i.line===r.line));const e=recIssues.filter((i)=>i.severity==="ERROR").length;const w=recIssues.filter((i)=>i.severity==="WARNING").length;return <tr key={r.id} className={`border-t cursor-pointer ${e?"bg-red-50":w?"bg-yellow-50":""} ${r.changed?"font-semibold":""}`} onClick={()=>setSelectedRecordId(r.id)}><td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={()=>toggleSelected(r.id)} onClick={(ev)=>ev.stopPropagation()} /></td><td>{r.line}</td><td>{r.relationKey}</td><td>{e?"ERROR":w?"WARNING":"OK"}</td><td>{e}</td><td>{w}</td><td>{r.changed?"sì":"no"}</td>{tableDefinitions[activeTable].fields.slice(0, 8).map((f)=><td key={f.code} className={r.fields[f.code]?.changed ? "bg-emerald-100" : ""}>{r.fields[f.code]?.currentValue.replaceAll(" ", "·")}</td>)}</tr>;})}</tbody></table></section>

    {selectedRecord && <section className="border rounded p-3 space-y-2"><h2 className="text-xl font-semibold">Dettaglio record e modifica singola</h2><p>Tabella {selectedRecord.table}, riga {selectedRecord.line}, chiave {selectedRecord.primaryKey}</p><code className="block whitespace-pre-wrap break-all">{selectedRecord.currentRecord.replaceAll(" ", "·")}</code><table className="w-full"><thead><tr><th>Codice</th><th>Nome</th><th>Originale</th><th>Corrente</th><th>Len</th><th>Tipo</th><th>Dominio</th><th>Issue</th><th>Azioni</th></tr></thead><tbody>{tableDefinitions[selectedRecord.table].fields.map((f)=>{const fi=issues.filter((i)=>i.recordId===selectedRecord.id&&i.fieldCode===f.code);const fv=selectedRecord.fields[f.code];const protectedField=protectedFieldCodes.has(f.code);return <tr key={f.code} className={`border-t ${fv.changed?"bg-emerald-50":""} ${protectedField?"text-slate-500":""}`}><td>{f.code}</td><td>{f.name}</td><td>{fv.originalValue.replaceAll(" ", "·")}</td><td>{f.domain ? <select disabled={protectedField} value={fv.currentValue} onChange={(e)=>onFieldChange(selectedRecord,f.code,e.target.value)}><option value="">vuoto</option>{f.domain.map((d)=><option key={d} value={d}>{d}</option>)}</select> : <input disabled={protectedField} className="border px-1" value={fv.currentValue} maxLength={f.length} onChange={(e)=>onFieldChange(selectedRecord,f.code,e.target.value)} />}</td><td>{fv.currentValue.length}/{f.length}</td><td>{f.type}</td><td>{f.domain?.join(",") ?? f.externalDomainCode ?? "-"}</td><td>{fi.map((x)=>`${x.severity}:${x.code}`).join(" | ") || "-"}</td><td><button className="border px-2" onClick={()=>updateRecord(restoreField(selectedRecord, tableDefinitions[selectedRecord.table], f.code))}>Ripristina campo</button></td></tr>;})}</tbody></table><button className="rounded bg-slate-800 px-3 py-1 text-white" onClick={()=>updateRecord(restoreRecord(selectedRecord))}>Ripristina record</button></section>}

    <section className="border rounded p-3 space-y-2"><h2 className="text-xl font-semibold">Errori e warning</h2><select value={severityFilter} onChange={(e)=>setSeverityFilter(e.target.value)}><option value="ALL">tutte</option><option>ERROR</option><option>WARNING</option><option>INFO</option></select><table className="w-full"><thead><tr><th>Gravità</th><th>Codice</th><th>Tabella</th><th>Riga</th><th>Campo</th><th>Messaggio</th></tr></thead><tbody>{filteredIssues.slice(0,200).map((i)=><tr key={i.id} className="border-t"><td>{i.severity}</td><td>{i.code}</td><td>{i.table}</td><td>{i.line ?? "-"}</td><td>{i.fieldCode ?? "-"}</td><td>{i.message}</td></tr>)}</tbody></table></section>

    <section className="border rounded p-3 space-y-2"><h2 className="text-xl font-semibold">Selezione record tramite filtri</h2><div className="flex gap-2"><select value={query.combinator} onChange={(e)=>setQuery({...query, combinator:e.target.value as QueryGroup["combinator"]})}><option>AND</option><option>OR</option></select><select value={query.conditions[0]?.fieldCode ?? ""} onChange={(e)=>setQuery({...query, conditions:[{...query.conditions[0], fieldCode:e.target.value}]})}><option value="">record</option>{tableDefinitions[activeTable].fields.map((f)=><option key={f.code} value={f.code}>{f.code} {f.name}</option>)}</select><select value={query.conditions[0]?.operator} onChange={(e)=>setQuery({...query, conditions:[{...query.conditions[0], operator:e.target.value as QueryGroup["conditions"][number]["operator"]}]})}>{["eq","neq","contains","notContains","startsWith","endsWith","isEmpty","isNotEmpty","in","notIn","gt","lt","gte","lte","hasError","hasWarning","hasIssueCode","isChanged","isNotChanged"].map((op)=><option key={op}>{op}</option>)}</select><input className="border px-2" value={query.conditions[0]?.value ?? ""} onChange={(e)=>setQuery({...query, conditions:[{...query.conditions[0], value:e.target.value}]})} /></div><p>Totale tabella: {activeRecords.length}; filtrati: {filteredRecords.length}; selezionati: {selectedIds.size}</p><button className="border px-3 py-1" onClick={()=>setSelectedIds(new Set(filteredRecords.map((r)=>r.id)))}>Seleziona tutti i record filtrati</button><button className="border px-3 py-1 ml-2" onClick={()=>setSelectedIds(new Set())}>Deseleziona tutti</button><div>Anteprima: {filteredRecords.slice(0,5).map((r)=>r.primaryKey).join(" · ")}</div></section>

    <section className="border rounded p-3 space-y-2"><h2 className="text-xl font-semibold">Modifica massiva</h2><div className="flex gap-2"><select value={bulkField} onChange={(e)=>setBulkField(e.target.value)}>{tableDefinitions[activeTable].fields.map((f)=><option key={f.code} value={f.code}>{f.code} {protectedFieldCodes.has(f.code)?"(protetto)":""}</option>)}</select><select value={bulkAction} onChange={(e)=>setBulkAction(e.target.value as BulkEditRequest["action"])}>{["set","clear","copy","replace","prefix","suffix","normalizeAlignment","restoreOriginal"].map((a)=><option key={a}>{a}</option>)}</select><input className="border px-2" value={bulkValue} onChange={(e)=>setBulkValue(e.target.value)} /><button className="rounded bg-orange-600 px-3 py-1 text-white" onClick={()=>setBulkPreview(previewBulkEdit(activeRecords, tableDefinitions[activeTable], { table: activeTable, fieldCode: bulkField, action: bulkAction, value: bulkValue, selectedRecordIds:[...selectedIds] }))}>Anteprima</button><button className="rounded bg-red-700 px-3 py-1 text-white" onClick={applyBulk}>Applica modifica a {selectedIds.size} record</button></div>{bulkPreview && <div><p>Atomica: {bulkPreview.atomic?"sì":"no"}; errori: {bulkPreview.errors.join(" | ") || "nessuno"}</p><ul>{bulkPreview.rows.slice(0,10).map((r)=><li key={r.recordId}>{r.recordId}: {r.previousValue.replaceAll(" ", "·")} → {r.nextValue.replaceAll(" ", "·")} {r.error}</li>)}</ul></div>}</section>

    <section className="border rounded p-3"><h2 className="text-xl font-semibold">Storico modifiche</h2><p>Record modificati: {modifiedCount}</p><button className="border px-3 py-1" onClick={undoLast}>Annulla ultima modifica</button><button className="border px-3 py-1 ml-2" onClick={restoreAll}>Ripristina tutte le modifiche</button><ul>{changeLog.map((c)=><li key={c.id}>{c.timestamp} - {c.description}</li>)}</ul></section>

    <section className="border rounded p-3"><h2 className="text-xl font-semibold">Esportazione</h2><p>{data.exportMessage}</p><p>L'export server-side scrive in {data.outputDir}; usare conferma esplicita nella procedura operativa. Questa UI mantiene la working copy in memoria e non modifica mai i file originali.</p></section>
  </div>;
}
