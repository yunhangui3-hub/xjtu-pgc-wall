import { access, cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportDirectory = path.join(projectRoot, "out");
const pagesDirectory = path.join(projectRoot, "dist");

await access(path.join(exportDirectory, "index.html"));
await rm(pagesDirectory, { recursive: true, force: true });
await mkdir(pagesDirectory, { recursive: true });
await cp(exportDirectory, pagesDirectory, { recursive: true });

await access(path.join(pagesDirectory, "index.html"));
console.log("Static Cloudflare Pages output ready: dist/index.html");
