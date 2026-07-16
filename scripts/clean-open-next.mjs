import { rm } from "node:fs/promises";

await rm(new URL("../.open-next/", import.meta.url), { recursive: true, force: true });
