import { readFile } from "node:fs/promises";

const raw = await readFile(new URL("../data/field-situations.json", import.meta.url), "utf8");
const situations = JSON.parse(raw);
const ids = new Set(situations.map((entry) => entry.id));
const areas = new Set(situations.map((entry) => entry.area));

if (situations.length < 50) throw new Error(`La banque terrain doit contenir au moins 50 situations (${situations.length}).`);
if (ids.size !== situations.length) throw new Error("La banque terrain contient des identifiants en double.");
if (areas.size < 10) throw new Error("La banque terrain ne couvre pas assez de familles métier.");
if (situations.some((entry) => !entry.situation || entry.situation.length < 25)) throw new Error("Une situation terrain est incomplète.");

console.log(`Banque terrain validée : ${situations.length} situations, ${areas.size} familles métier.`);
