import { NextResponse } from "next/server";
import { tableDefinitions } from "@/lib/sirco/definitions";
import { exportCorrectedFiles } from "@/lib/sirco/exporter";
import { discoverInputFiles, loadExternalDomains, readDiscoveredFile } from "@/lib/sirco/file-reader";
import { parseFixedLengthContent } from "@/lib/sirco/parser";
import { validateTable } from "@/lib/sirco/validator";
import { validateRelationsWithoutAnagrafica } from "@/lib/sirco/relational-validator";
import type { ChangeLogEntry, ParsedRecord, SircoTable } from "@/lib/sirco/types";

type ExportBody = { confirm?: boolean; records?: Partial<Record<SircoTable, ParsedRecord[]>>; changeLog?: ChangeLogEntry[] };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as ExportBody;
  if (!body.confirm) return NextResponse.json({ error: "Conferma esplicita richiesta prima di esportare." }, { status: 400 });
  const discovery = await discoverInputFiles();
  const externalDomains = await loadExternalDomains();
  const records = {} as Record<SircoTable, ParsedRecord[]>;
  const fileNames = {} as Record<SircoTable, string>;
  for (const table of Object.keys(tableDefinitions) as SircoTable[]) {
    const found = discovery[table];
    if (found.status !== "FOUND") { records[table] = []; continue; }
    fileNames[table] = found.fileName;
    records[table] = body.records?.[table] ?? parseFixedLengthContent(await readDiscoveredFile(found), tableDefinitions[table]);
  }
  const issues = [...(Object.keys(tableDefinitions) as SircoTable[]).flatMap((table) => validateTable(records[table], tableDefinitions[table], {}, externalDomains)), ...validateRelationsWithoutAnagrafica(records)];
  if (issues.some((issue) => issue.code === "VALUE_TOO_LONG" || issue.code === "RECORD_LENGTH")) return NextResponse.json({ error: "Export bloccato: presenti errori di ricostruzione record.", issues }, { status: 400 });
  const written = await exportCorrectedFiles(fileNames, records, tableDefinitions, body.changeLog ?? []);
  return NextResponse.json({ message: "I file originali in data/input non vengono modificati. I file corretti vengono scritti in data/output.", written });
}
