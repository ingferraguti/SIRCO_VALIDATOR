export function RecordsGrid({ table, data }: { table: string; data: any }) {
  const records = data?.records ?? [];
  const issues = data?.issues ?? [];
  const fields = records[0] ? Object.keys(records[0].fields) : [];
  return <div className="overflow-auto rounded border p-2">
    <p className="mb-2">Tabella {table} - {records.length} record - stato file: {data?.fileStatus ?? "-"}</p>
    <table className="w-full text-sm"><thead><tr><th>Riga</th><th>Chiave</th>{fields.map((f: string) => <th key={f}>{f}</th>)}</tr></thead>
      <tbody>{records.map((r: any) => <tr key={r.line} className="border-t"><td>{r.line}</td><td>{r.logicalKey}</td>{fields.map((f: string) => {
        const bad = issues.some((i: any) => i.line === r.line && i.fieldCode === f);
        return <td key={f} className={bad ? "bg-red-100" : ""}>{r.fields[f]}</td>;
      })}</tr>)}</tbody></table>
  </div>;
}
