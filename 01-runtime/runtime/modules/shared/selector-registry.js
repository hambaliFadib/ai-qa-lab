const fs = require("fs");
const path = require("path");
const { writeJson } = require("../../../tools/workspace-paths");

function loadSelectorRegistry(registryPath) {
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

function readByPath(object, dottedPath) {
  return String(dottedPath || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), object);
}

function getSelectorEntry(registry, dottedPath) {
  const entry = readByPath(registry.selectors || {}, dottedPath);
  if (!entry) {
    throw new Error(`Selector registry entry not found: ${dottedPath}`);
  }
  return entry;
}

function getSelectorCandidates(registry, dottedPath) {
  const entry = getSelectorEntry(registry, dottedPath);
  if (Array.isArray(entry.candidates)) {
    return entry.candidates;
  }
  if (entry.selector) {
    return [entry.selector];
  }
  return [];
}

function recordSelectorObservation(registryPath, dottedPath, observation = {}) {
  const registry = loadSelectorRegistry(registryPath);
  const entry = getSelectorEntry(registry, dottedPath);
  entry.observations = entry.observations || {
    pass_count: 0,
    fail_count: 0,
    last_seen_at: null,
    last_note: null,
  };

  if (observation.ok) {
    entry.observations.pass_count += 1;
  } else {
    entry.observations.fail_count += 1;
  }

  entry.observations.last_seen_at = new Date().toISOString();
  entry.observations.last_note = observation.note || null;
  registry.updated_at = new Date().toISOString();

  writeJson(registryPath, registry);
  return entry.observations;
}

function resolveModuleRegistryPath(moduleDir, fileName = "selector-registry.json") {
  return path.join(moduleDir, fileName);
}

module.exports = {
  loadSelectorRegistry,
  getSelectorEntry,
  getSelectorCandidates,
  recordSelectorObservation,
  resolveModuleRegistryPath,
};
