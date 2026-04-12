const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
} = require("./workspace-paths");
const { refreshRecallIndex } = require("./refresh-recall-index");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    args[key] = value;
    index += 1;
  }

  return args;
}

function canonicalize(blockWithoutHash) {
  return JSON.stringify(blockWithoutHash);
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireLedgerLock(lockPath, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;
  const pollMs = Number.isFinite(options.pollMs) ? options.pollMs : 200;
  const staleMs = Number.isFinite(options.staleMs) ? options.staleMs : 10 * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(
        fd,
        `${JSON.stringify({
          pid: process.pid,
          acquired_at: new Date().toISOString(),
        }, null, 2)}\n`,
        "utf8"
      );
      return fd;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      try {
        const stats = fs.statSync(lockPath);
        const ageMs = Date.now() - stats.mtimeMs;
        if (ageMs >= staleMs) {
          fs.unlinkSync(lockPath);
          continue;
        }
      } catch (lockError) {
        if (lockError.code === "ENOENT") {
          continue;
        }
        throw lockError;
      }

      sleepSync(pollMs);
    }
  }

  throw new Error("Timed out while waiting for the learning-ledger append lock.");
}

function releaseLedgerLock(lockPath, lockFd) {
  if (typeof lockFd === "number") {
    try {
      fs.closeSync(lockFd);
    } catch (error) {
      // Best effort close only.
    }
  }

  if (fs.existsSync(lockPath)) {
    try {
      fs.unlinkSync(lockPath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}

function computeHash(blockWithoutHash) {
  return crypto
    .createHash("sha256")
    .update(canonicalize(blockWithoutHash))
    .digest("hex");
}

function readPayload(payloadPath) {
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
  const required = ["module", "agent", "type", "summary"];
  const missing = required.filter((field) => !payload[field]);

  if (missing.length > 0) {
    throw new Error(`Payload missing required fields: ${missing.join(", ")}`);
  }

  return payload;
}

function updateGroupedIndex(filePath, groupKey, descriptor) {
  const existing = readJsonIfExists(filePath, {});
  const entries = existing[groupKey] || [];

  entries.unshift(descriptor);
  existing[groupKey] = entries.slice(0, 50);
  writeJson(filePath, existing);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Usage: node append-learning-block.js --input <payload.json>");
  }

  const payload = readPayload(args.input);
  ensureDir(paths.ledgerBlocksDir);
  ensureDir(paths.ledgerIndexDir);
  ensureDir(paths.ledgerManifestDir);

  const lockPath = path.join(paths.ledgerManifestDir, "append.lock");
  const lockFd = acquireLedgerLock(lockPath);

  try {
    const chainStatePath = path.join(paths.ledgerManifestDir, "chain-state.json");
    const chainState = readJsonIfExists(chainStatePath, {
      version: "learning-ledger-v1",
      block_count: 0,
      latest_block_id: null,
      latest_hash: "GENESIS",
      last_updated: null,
    });

    const nextBlockNumber = chainState.block_count + 1;
    const blockId = `LLV1-${String(nextBlockNumber).padStart(6, "0")}`;

    const blockWithoutHash = {
      id: blockId,
      timestamp: payload.timestamp || new Date().toISOString(),
      module: payload.module,
      agent: payload.agent,
      type: payload.type,
      summary: payload.summary,
      derived_updates: Array.isArray(payload.derived_updates)
        ? payload.derived_updates
        : [],
      evidence_refs: Array.isArray(payload.evidence_refs) ? payload.evidence_refs : [],
      previous_hash: chainState.latest_hash || "GENESIS",
    };

    const block = {
      ...blockWithoutHash,
      current_hash: computeHash(blockWithoutHash),
    };

    const blockPath = path.join(paths.ledgerBlocksDir, `${blockId}.json`);
    writeJson(blockPath, block);

    const descriptor = {
      id: block.id,
      timestamp: block.timestamp,
      module: block.module,
      type: block.type,
      summary: block.summary,
      path: path.relative(paths.rootDir, blockPath).replace(/\\/g, "/"),
      current_hash: block.current_hash,
    };

    chainState.block_count = nextBlockNumber;
    chainState.latest_block_id = block.id;
    chainState.latest_hash = block.current_hash;
    chainState.last_updated = new Date().toISOString();
    writeJson(chainStatePath, chainState);

    updateGroupedIndex(
      path.join(paths.ledgerIndexDir, "by-module.json"),
      block.module,
      descriptor
    );
    updateGroupedIndex(
      path.join(paths.ledgerIndexDir, "by-type.json"),
      block.type,
      descriptor
    );

    writeJson(path.join(paths.ledgerIndexDir, "latest.json"), {
      generated_at: new Date().toISOString(),
      latest_block: descriptor,
      block_count: chainState.block_count,
      latest_hash: chainState.latest_hash,
    });

    try {
      refreshRecallIndex();
    } catch (error) {
      process.stderr.write(`[warn] ${error.message}\n`);
    }

    process.stdout.write(`${JSON.stringify(descriptor, null, 2)}\n`);
  } finally {
    releaseLedgerLock(lockPath, lockFd);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
