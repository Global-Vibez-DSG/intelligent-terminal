#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//u.test(value);
}

function validateProductManifest(manifest) {
  assert(manifest.product, "product-manifest.json must define product.");
  assert(manifest.manifestMeta, "product-manifest.json must define manifestMeta.");
  assert(
    isHttpUrl(manifest.product.companionWebsite),
    "product-manifest.json must define a valid product.companionWebsite URL."
  );
  assert(
    isHttpUrl(manifest.manifestMeta.rawUrl),
    "product-manifest.json must define a valid manifestMeta.rawUrl."
  );
  assert(
    isHttpUrl(manifest.manifestMeta.consumedBy),
    "product-manifest.json must define a valid manifestMeta.consumedBy URL."
  );
}

function validateCompanionConfig(config) {
  assert(
    config.companionWebsite,
    "companion-config.json must define companionWebsite."
  );
  assert(
    isHttpUrl(config.companionWebsite.url),
    "companion-config.json must define companionWebsite.url."
  );
  assert(
    typeof config.companionWebsite.repo === "string" &&
      config.companionWebsite.repo.includes("github.com/"),
    "companion-config.json must define companionWebsite.repo as a GitHub URL."
  );
}

function validateEcosystemMap(map) {
  assert(map.organization, "ecosystem-map.json must define organization.");
  assert(
    Array.isArray(map.repos) && map.repos.length > 0,
    "ecosystem-map.json must define at least one repo."
  );

  const repoIds = new Set();
  for (const repo of map.repos) {
    assert(repo.id, "Each ecosystem repo must define id.");
    assert(repo.fullName, `Repo ${repo.id} must define fullName.`);
    assert(
      repo.defaultBranch === map.organization.defaultBranch,
      `Repo ${repo.id} must use the shared default branch ${map.organization.defaultBranch}.`
    );
    assert(
      typeof repo.primaryOwner === "string" && repo.primaryOwner.startsWith("@"),
      `Repo ${repo.id} must define a GitHub handle as primaryOwner.`
    );
    repoIds.add(repo.id);
  }

  for (const repo of map.repos) {
    for (const dependency of repo.dependsOn || []) {
      assert(
        repoIds.has(dependency),
        `Repo ${repo.id} depends on unknown repo id ${dependency}.`
      );
    }
  }
}

function validateCrossLinks(manifest, companion, map) {
  assert(
    manifest.product.companionWebsite === companion.companionWebsite.url,
    "product-manifest.json companion website must match companion-config.json."
  );
  assert(
    manifest.manifestMeta.consumedBy === companion.companionWebsite.url,
    "manifestMeta.consumedBy must match companion-config companion website."
  );

  const terminalRepo = map.repos.find(
    (repo) => repo.fullName === "Global-Vibez-DSG/intelligent-terminal"
  );
  const websiteRepo = map.repos.find(
    (repo) => repo.fullName === "johnnyh3611-bit/global_vibez_dsg1"
  );

  assert(terminalRepo, "ecosystem-map.json must include this repository.");
  assert(websiteRepo, "ecosystem-map.json must include the companion website repository.");
  assert(
    websiteRepo.manifestSource === manifest.manifestMeta.rawUrl,
    "Website manifestSource must match product-manifest rawUrl."
  );
  assert(
    websiteRepo.websiteSurface === companion.companionWebsite.url,
    "Website repo entry must match companion website URL."
  );
}

function main() {
  const manifest = readJson("integration/product-manifest.json");
  const companion = readJson("integration/companion-config.json");
  const ecosystem = readJson("integration/ecosystem-map.json");

  validateProductManifest(manifest);
  validateCompanionConfig(companion);
  validateEcosystemMap(ecosystem);
  validateCrossLinks(manifest, companion, ecosystem);

  console.log("Validated Global Vibez integration assets successfully.");
}

main();
