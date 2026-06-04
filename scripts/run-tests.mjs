import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".test-build");
const files = execFileSync("rg", ["--files", "src/lib/sirco", "tests"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
await rm(out, { recursive: true, force: true });
for (const file of files) {
  const source = await readFile(join(root, file), "utf8");
  const js = ts.transpileModule(source.replaceAll('from "@/lib/', 'from "../src/lib/'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler, esModuleInterop: true } }).outputText;
  const target = join(out, relative(root, join(root, file))).replace(/\.ts$/, ".mjs");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, js.replaceAll(/from "(\.\.?\/[^\"]+)"/g, 'from "$1.mjs"'), "utf8");
}
const testFiles = execFileSync("rg", ["--files", join(out, "tests")], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
execFileSync("node", ["--test", ...testFiles], { stdio: "inherit" });
