#!/usr/bin/env node
// scripts/update-manifest.js
// Updates product.version and manifestMeta.lastUpdated in
// integration/product-manifest.json.
//
// Usage:
//   node scripts/update-manifest.js <version> <date>
//
// Arguments:
//   version  New product version string, e.g. "0.8.0.2"
//   date     ISO 8601 date string, e.g. "2026-06-27"
//
// Called by .github/workflows/update-manifest.yml on each published release.

"use strict";

const fs = require("fs");
const path = require("path");

const [, , version, date] = process.argv;

if (!version || !date) {
  console.error(
    "Usage: node scripts/update-manifest.js <version> <date>\n" +
      "  version  e.g. 0.8.0.2\n" +
      "  date     ISO 8601 date, e.g. 2026-06-27"
  );
  process.exit(1);
}

const manifestPath = path.resolve(
  __dirname,
  "..",
  "integration",
  "product-manifest.json"
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

manifest.product.version = version;
manifest.manifestMeta.lastUpdated = date;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `Updated ${manifestPath}: version=${version}, lastUpdated=${date}`
);
