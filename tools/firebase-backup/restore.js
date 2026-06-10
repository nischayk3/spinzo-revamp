#!/usr/bin/env node
/**
 * Spinzo Firebase Restore Tool
 * =============================
 * Restores Firestore data from a backup JSON file.
 *
 * ⚠️  WARNING: This OVERWRITES existing documents with the same IDs.
 *     Subcollections are also restored recursively.
 *     Auth users are NOT restored by this script — use Firebase CLI for that.
 *
 * Usage:
 *   node restore.js --from=../../backups/2026-05-25_12-00-00
 *   node restore.js --from=../../backups/2026-05-25_12-00-00 --collection=users
 *
 * Options:
 *   --from=<path>         Path to a backup directory
 *   --collection=<name>   Restore only a specific root collection (optional)
 *   --dry-run             Simulate restore without writing anything
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Config ────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "../../firebase-service-account.json");

// Parse CLI args
const args = process.argv.slice(2);
const fromFlag = args.find((a) => a.startsWith("--from="))?.split("=")[1];
const collectionFlag = args.find((a) => a.startsWith("--collection="))?.split("=")[1];
const dryRun = args.includes("--dry-run");

if (!fromFlag) {
  console.error("❌  Missing --from flag. Usage: node restore.js --from=../../backups/<timestamp>");
  process.exit(1);
}

const backupDir = path.resolve(__dirname, fromFlag);
const firestoreBackupPath = path.join(backupDir, "firestore.json");

if (!fs.existsSync(firestoreBackupPath)) {
  console.error(`❌  No firestore.json found in: ${backupDir}`);
  process.exit(1);
}

// ── Init ──────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function log(msg) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`[${time}] ${msg}`);
}

// ── Deserialize ───────────────────────────────────────────────────────────────
function deserializeFirestoreData(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === "object" && data.__type === "Timestamp") {
    return new admin.firestore.Timestamp(data._seconds, data._nanoseconds);
  }

  if (typeof data === "object" && data.__type === "GeoPoint") {
    return new admin.firestore.GeoPoint(data.latitude, data.longitude);
  }

  if (typeof data === "object" && data.__type === "DocumentReference") {
    return db.doc(data.path);
  }

  if (Array.isArray(data)) {
    return data.map(deserializeFirestoreData);
  }

  if (typeof data === "object") {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (key !== "__subcollections") {
        result[key] = deserializeFirestoreData(value);
      }
    }
    return result;
  }

  return data;
}

// ── Restore Recursive ─────────────────────────────────────────────────────────
let restoredCount = 0;

async function restoreDocument(colRef, docId, docData) {
  const docRef = colRef.doc(docId);
  const plainData = deserializeFirestoreData(docData);

  if (!dryRun) {
    await docRef.set(plainData, { merge: false });
  }

  restoredCount++;
  if (restoredCount % 50 === 0) log(`    ... ${restoredCount} documents restored`);

  // Restore subcollections
  if (docData.__subcollections) {
    for (const [subColId, subDocs] of Object.entries(docData.__subcollections)) {
      const subColRef = docRef.collection(subColId);
      for (const [subDocId, subDocData] of Object.entries(subDocs)) {
        await restoreDocument(subColRef, subDocId, subDocData);
      }
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`🔄  Spinzo Firestore Restore`);
  log(`    Backup: ${backupDir}`);
  if (dryRun) log("    ⚠️   DRY RUN — nothing will be written");
  if (collectionFlag) log(`    Scope: collection '${collectionFlag}' only`);
  log("─".repeat(60));

  const backup = JSON.parse(fs.readFileSync(firestoreBackupPath, "utf8"));
  const collections = collectionFlag
    ? { [collectionFlag]: backup[collectionFlag] }
    : backup;

  if (collectionFlag && !backup[collectionFlag]) {
    console.error(`❌  Collection '${collectionFlag}' not found in backup.`);
    process.exit(1);
  }

  const startTime = Date.now();

  for (const [colId, docs] of Object.entries(collections)) {
    log(`→  Restoring collection: ${colId} (${Object.keys(docs).length} docs)`);
    const colRef = db.collection(colId);

    for (const [docId, docData] of Object.entries(docs)) {
      await restoreDocument(colRef, docId, docData);
    }

    log(`✓  ${colId} done`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log("─".repeat(60));
  log(`✅  Restore complete: ${restoredCount} documents in ${elapsed}s`);
  if (dryRun) log("    (Dry run — no data was written)");

  await admin.app().delete();
}

main().catch((err) => {
  console.error("❌  Restore failed:", err);
  process.exit(1);
});
