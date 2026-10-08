import { copyFile, mkdir } from "node:fs/promises";

const wurzel = new URL("../", import.meta.url);
const ziel = new URL("dist/nodes/DocuFleet/", wurzel);
await mkdir(ziel, { recursive: true });
await copyFile(new URL("nodes/DocuFleet/docufleet.svg", wurzel), new URL("docufleet.svg", ziel));
