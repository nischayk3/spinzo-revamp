#!/usr/bin/env node
/**
 * Spinzo Backup Verifier
 * ======================
 * Reads a backup directory and prints a summary without touching Firebase.
 * Use this to confirm a backup is complete and uncorrupted before relying on it.
 *
 * Usage:
 *   node verify-backup.js --from=../../backups/2026-05-25_12-00-00
 *   node verify-backup.js  ← verifies the most recent backup automatically
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(__dirname, "../../backups");

const args = process.argv.slice(2);
const fromFlag = args.find((a) => a.startsWith("--from="))?.split("=")[1];

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_ROOT)) return null;
  const entries = fs.readdirSync(BACKUP_ROOT)
    .filter((e) => fs.statSync(path.join(BACKUP_ROOT, e)).isDirectory())
    .sort()
    .reverse();
  return entries[0] ? path.join(BACKUP_ROOT, entries[0]) : null;
}

const backupDir = fromFlag
  ? path.resolve(__dirname, fromFlag)
  : findLatestBackup();

if (!backupDir) {
  console.error("❌  No backup directory found. Run backup.js first.");
  process.exit(1);
}

console.log("🔍  Verifying backup:", backupDir);
console.log("─".repeat(60));

// Read manifest
const manifestPath = path.join(backupDir, "manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`📋  Manifest:`);
  console.log(`    Project:   ${manifest.project_id}`);
  console.log(`    Timestamp: ${manifest.timestamp}`);
  console.log(`    Duration:  ${(manifest.durationMs / 1000).toFixed(1)}s`);
} else {
  console.warn("⚠️   No manifest.json found");
}

// Verify Firestore backup
const firestorePath = path.join(backupDir, "firestore.json");
if (fs.existsSync(firestorePath)) {
  const raw = fs.readFileSync(firestorePath, "utf8");
  const data = JSON.parse(raw);
  const fileSizeKB = Math.round(fs.statSync(firestorePath).size / 1024);

  let totalDocs = 0;
  const collectionSummary = [];

  function countDocs(obj, depth = 0) {
    for (const [key, val] of Object.entries(obj)) {
      if (key === "__subcollections") {
        for (const [subColId, subDocs] of Object.entries(val)) {
          const subCount = Object.keys(subDocs).length;
          collectionSummary.push({ name: `  └─ ${subColId} (subcollection)`, count: subCount });
          totalDocs += subCount;
        }
      } else {
        totalDocs++;
      }
    }
  }

  console.log(`\n📦  Firestore Backup (${fileSizeKB} KB):`);
  for (const [colId, docs] of Object.entries(data)) {
    const count = Object.keys(docs).length;
    console.log(`    ${colId}: ${count} documents`);
    totalDocs += count;

    // Check for subcollections
    for (const docData of Object.values(docs)) {
      if (docData.__subcollections) {
        for (const [subColId, subDocs] of Object.entries(docData.__subcollections)) {
          console.log(`      └─ ${subColId}: ${Object.keys(subDocs).length} subdocs`);
        }
      }
    }
  }
  console.log(`    ─────────────────────`);
  console.log(`    Total: ${totalDocs} documents`);
} else {
  console.log("⏭️   No firestore.json in this backup");
}

// Verify Auth backup
const authPath = path.join(backupDir, "auth-users.json");
if (fs.existsSync(authPath)) {
  const users = JSON.parse(fs.readFileSync(authPath, "utf8"));
  const fileSizeKB = Math.round(fs.statSync(authPath).size / 1024);

  const providers = {};
  let verified = 0;
  let disabled = 0;
  for (const u of users) {
    if (u.emailVerified) verified++;
    if (u.disabled) disabled++;
    for (const p of u.providerData || []) {
      providers[p.providerId] = (providers[p.providerId] || 0) + 1;
    }
  }

  console.log(`\n👥  Auth Backup (${fileSizeKB} KB):`);
  console.log(`    Total users:    ${users.length}`);
  console.log(`    Email verified: ${verified}`);
  console.log(`    Disabled:       ${disabled}`);
  console.log(`    Providers:`, providers);
} else {
  console.log("⏭️   No auth-users.json in this backup");
}

console.log("\n✅  Backup verification complete.");
console.log("─".repeat(60));
