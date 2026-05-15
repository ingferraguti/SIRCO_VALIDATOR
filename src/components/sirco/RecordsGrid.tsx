import { ParsedRecord, ValidationIssue } from "@/lib/sirco/types";

type Props = {
  table: string;
  records: ParsedRecord[];
  issues: ValidationIssue[];
  selectedLine: number | null;
  onSelectRecord: (line: number) => void;
};

export function RecordsGrid({ table, records, issues, selectedLine, onSelectRecord }: Props) {
  const fields = records[0] ? Object.keys(records[0].fields) : [];
  return <div className="overflow-auto rounded border p-2">
    <p className="mb-2">Tabella {table} - {records.length} record</p>
    <table className="w-full text-sm"><thead><tr><th>Riga</th><th>Chiave</th>{fields.map((f) => <th key={f}>{f}</th>)}</tr></thead>
      <tbody>{records.map((r) => <tr key={r.line} onClick={() => onSelectRecord(r.line)} className={`border-t cursor-pointer ${selectedLine === r.line ? "bg-yellow-100" : ""}`}>
        <td>{r.line}</td><td>{r.logicalKey}</td>{fields.map((f) => {
          const bad = issues.some((i) => i.line === r.line && i.fieldCode === f);
          return <td key={f} className={bad ? "bg-red-100" : ""}>{r.fields[f]}</td>;
        })}
      </tr>)}</tbody></table>
  </div>;
}
