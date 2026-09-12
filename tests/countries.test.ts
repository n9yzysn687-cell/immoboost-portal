import assert from "node:assert/strict";
import test from "node:test";
import { getCountryPack, isOfficialSource } from "../lib/countries.ts";

test("the Belgian country pack is explicit and versioned", () => {
  const country = getCountryPack("BE");
  assert.equal(country.locale, "fr-BE");
  assert.match(country.version, /^BE-\d{4}\.\d{2}\.\d+$/);
  assert.ok(country.regions.includes("Wallonie"));
});

test("official source validation rejects lookalike and unsafe links", () => {
  const country = getCountryPack("BE");
  assert.equal(isOfficialSource("https://www.wallonie.be/fr/demarches", country), true);
  assert.equal(isOfficialSource("https://wallonie.be.attacker.example/faux", country), false);
  assert.equal(isOfficialSource("http://wallonie.be/insecure", country), false);
  assert.equal(isOfficialSource("javascript:alert(1)", country), false);
});
