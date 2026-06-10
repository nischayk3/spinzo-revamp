#!/usr/bin/env node
/**
 * Spinzo Firebase Backup Tool
 * ===========================
 * Backs up ALL Firestore collections (including subcollections) and
 * ALL Firebase Auth users to timestamped JSON files in ../../backups/
 *
 * Usage:
 *   node backup.js               → Full backup (Firestore + Auth)
 *   node backup.js --only=firestore
 *   node backup.js --only=auth
 *
 * Output (never committed — excluded by .gitignore):
 *   ../../backups/YYYY-MM-DD_HH-mm-ss/firestore.json
 *   ../../backups/YYYY-MM-DD_HH-mm-ss/auth-users.json
 *   ../../backups/YYYY-MM-DD_HH-mm-ss/manifest.json
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Config ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "../../firebase-service-account.json");
const BACKUP_ROOT = path.resolve(__dirname, "../../backups");

// Parse CLI args
const args = process.argv.slice(2);
const onlyFlag = args.find((a) => a.startsWith("--only="))?.split("=")[1];
const doFirestore = !onlyFlag || onlyFlag === "firestore";
const doAuth = !onlyFlag || onlyFlag === "auth";

// ── Init ─────────────────────────────────────────────────────────────────────
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
} catch (e) {
  console.error("❌  Cannot read service account:", SERVICE_ACCOUNT_PATH);
  console.error("    Place firebase-service-account.json in the project root.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// ── Helpers ───────────────────────────────────────────────────────────────────
function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

function log(msg) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`[${time}] ${msg}`);
}

/**
 * Recursively exports a Firestore document including all subcollections.
 * Returns a plain object suitable for JSON serialization.
 */
async function exportDocument(docRef) {
  const snap = await docRef.get();
  if (!snap.exists) return null;

  const data = snap.data();

  // Convert Firestore-specific types to serialisable form
  const serialised = serializeFirestoreData(data);

  // Recurse into subcollections
  const subCollections = await docRef.listCollections();
  for (const subColRef of subCollections) {
    const subDocs = await subColRef.listDocuments();
    serialised.__subcollections = serialised.__subcollections || {};
    serialised.__subcollections[subColRef.id] = {};

    for (const subDocRef of subDocs) {
      const subDocData = await exportDocument(subDocRef);
      if (subDocData !== null) {
        serialised.__subcollections[subColRef.id][subDocRef.id] = subDocData;
      }
    }
  }

  return serialised;
}

/**
 * Converts Firestore-specific types (Timestamp, GeoPoint, DocumentReference)
 * to plain JSON-serialisable values.
 */
function serializeFirestoreData(data) {
  if (data === null || data === undefined) return data;

  if (data instanceof admin.firestore.Timestamp) {
    return { __type: "Timestamp", _seconds: data.seconds, _nanoseconds: data.nanoseconds };
  }

  if (data instanceof admin.firestore.GeoPoint) {
    return { __type: "GeoPoint", latitude: data.latitude, longitude: data.longitude };
  }

  if (data instanceof admin.firestore.DocumentReference) {
    return { __type: "DocumentReference", path: data.path };
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  if (typeof data === "object") {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }

  return data;
}

// ── Firestore Backup ──────────────────────────────────────────────────────────
async function backupFirestore(backupDir) {
  log("📦  Starting Firestore backup...");
  const firestoreData = {};
  let totalDocs = 0;
  let totalCollections = 0;

  const rootCollections = await db.listCollections();
  log(`    Found ${rootCollections.length} root collection(s)`);

  for (const colRef of rootCollections) {
    totalCollections++;
    log(`    → Exporting collection: ${colRef.id}`);
    firestoreData[colRef.id] = {};

    const snapshot = await colRef.listDocuments();

    for (const docRef of snapshot) {
      const docData = await exportDocument(docRef);
      if (docData !== null) {
        firestoreData[colRef.id][docRef.id] = docData;
        totalDocs++;

        if (totalDocs % 100 === 0) {
          log(`    ... ${totalDocs} documents exported so far`);
        }
      }
    }

    log(`    ✓ ${colRef.id}: exported ${Object.keys(firestoreData[colRef.id]).length} documents`);
  }

  const outputPath = path.join(backupDir, "firestore.json");
  fs.writeFileSync(outputPath, JSON.stringify(firestoreData, null, 2), "utf8");

  const fileSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  log(`✅  Firestore backup complete: ${totalDocs} docs across ${totalCollections} collections (${fileSizeKB} KB)`);
  log(`    Saved → ${outputPath}`);

  return { totalDocs, totalCollections, fileSizeKB };
}

// ── Auth Backup ───────────────────────────────────────────────────────────────
async function backupAuth(backupDir) {
  log("👥  Starting Firebase Auth backup...");
  const allUsers = [];
  let pageToken = undefined;
  let page = 1;

  do {
    log(`    Fetching page ${page}...`);
    const listResult = await auth.listUsers(1000, pageToken);

    listResult.users.forEach((user) => {
      // Export full user record as JSON-serialisable object
      allUsers.push({
        uid: user.uid,
        email: user.email || null,
        emailVerified: user.emailVerified,
        displayName: user.displayName || null,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
          lastRefreshTime: user.metadata.lastRefreshTime || null,
        },
        providerData: user.providerData.map((p) => ({
          providerId: p.providerId,
          uid: p.uid,
          displayName: p.displayName || null,
          email: p.email || null,
          phoneNumber: p.phoneNumber || null,
          photoURL: p.photoURL || null,
        })),
        customClaims: user.customClaims || null,
        tenantId: user.tenantId || null,
      });
    });

    pageToken = listResult.pageToken;
    page++;
  } while (pageToken);

  const outputPath = path.join(backupDir, "auth-users.json");
  fs.writeFileSync(outputPath, JSON.stringify(allUsers, null, 2), "utf8");

  const fileSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  log(`✅  Auth backup complete: ${allUsers.length} users (${fileSizeKB} KB)`);
  log(`    Saved → ${outputPath}`);

  return { totalUsers: allUsers.length, fileSizeKB };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const ts = timestamp();
  const backupDir = path.join(BACKUP_ROOT, ts);
  fs.mkdirSync(backupDir, { recursive: true });

  log(`🚀  Spinzo Firebase Backup`);
  log(`    Project: ${serviceAccount.project_id}`);
  log(`    Output:  ${backupDir}`);
  log(`    Mode:    ${onlyFlag ? onlyFlag : "full (firestore + auth)"}`);
  log("─".repeat(60));

  const startTime = Date.now();
  const manifest = {
    project_id: serviceAccount.project_id,
    timestamp: new Date().toISOString(),
    mode: onlyFlag || "full",
    durationMs: 0,
    firestore: null,
    auth: null,
  };

  try {
    if (doFirestore) {
      manifest.firestore = await backupFirestore(backupDir);
    }

    if (doAuth) {
      manifest.auth = await backupAuth(backupDir);
    }

    manifest.durationMs = Date.now() - startTime;

    // Write manifest
    const manifestPath = path.join(backupDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    log("─".repeat(60));
    log(`🎉  Backup finished in ${(manifest.durationMs / 1000).toFixed(1)}s`);
    log(`    Directory: ${backupDir}`);

    if (manifest.firestore) {
      log(`    Firestore: ${manifest.firestore.totalDocs} docs / ${manifest.firestore.totalCollections} collections`);
    }
    if (manifest.auth) {
      log(`    Auth:      ${manifest.auth.totalUsers} users`);
    }

    log("\n⚠️   These backup files contain sensitive user data.");
    log("     They are excluded from git by .gitignore.");
    log("     Store them securely (encrypted drive or private cloud storage).\n");
  } catch (err) {
    console.error("\n❌  Backup failed:", err);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

main();
