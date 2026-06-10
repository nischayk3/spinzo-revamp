#!/usr/bin/env node
/**
 * Firebase Test Token Generator
 * ==============================
 * Creates a REAL Firebase ID token for testing your auth-service locally.
 *
 * How it works:
 *   1. Uses Admin SDK to create a Custom Token for a known user UID
 *   2. Exchanges that Custom Token for a real ID Token via Firebase Auth REST API
 *   3. Prints a ready-to-use curl command
 *
 * Usage:
 *   node get-test-token.js                        → Uses first user from your backup
 *   node get-test-token.js --uid=SOME_USER_UID    → Uses a specific UID
 *
 * Requires: firebase-admin (already installed in this package)
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "../../firebase-service-account.json");

// Parse args
const args = process.argv.slice(2);
const uidFlag = args.find((a) => a.startsWith("--uid="))?.split("=")[1];

// ── Init Firebase Admin ──────────────────────────────────────────────────────
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
const projectId = serviceAccount.project_id;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function getTestUid() {
  if (uidFlag) return uidFlag;

  // Try to get a real user UID from your auth backup
  const backupRoot = path.resolve(__dirname, "../../backups");
  if (fs.existsSync(backupRoot)) {
    const dirs = fs.readdirSync(backupRoot).sort().reverse();
    for (const dir of dirs) {
      const authFile = path.join(backupRoot, dir, "auth-users.json");
      if (fs.existsSync(authFile)) {
        const users = JSON.parse(fs.readFileSync(authFile, "utf8"));
        if (users.length > 0) {
          console.log(`Using UID from backup: ${users[0].uid} (${users[0].email || users[0].phoneNumber || "anonymous"})`);
          return users[0].uid;
        }
      }
    }
  }

  // Fallback: list users from Firebase
  console.log("No backup found, fetching first user from Firebase Auth...");
  const listResult = await admin.auth().listUsers(1);
  if (listResult.users.length > 0) {
    const u = listResult.users[0];
    console.log(`Using UID from Firebase: ${u.uid} (${u.email || u.phoneNumber || "anonymous"})`);
    return u.uid;
  }

  console.error("❌  No users found in Firebase Auth. Create a test user first.");
  process.exit(1);
}

async function main() {
  console.log("🔑  Firebase Test Token Generator");
  console.log(`    Project: ${projectId}`);
  console.log("─".repeat(60));

  const uid = await getTestUid();

  // Step 1: Create a Custom Token
  console.log(`\n1️⃣  Creating custom token for UID: ${uid}`);
  const customToken = await admin.auth().createCustomToken(uid);
  console.log("   ✓ Custom token created");

  // Step 2: Exchange Custom Token → ID Token via Firebase Auth REST API
  // This is the official way: https://firebase.google.com/docs/reference/rest/auth#section-verify-custom-token
  console.log("2️⃣  Exchanging custom token for a real ID token...");

  const apiKey = await getWebApiKey(projectId);

  const response = await fetch(
    `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("❌  Token exchange failed:", err);
    console.error("\n💡  This usually means your Web API Key is wrong or restricted.");
    console.error("    Go to: Firebase Console → Project Settings → General → Web API Key");
    console.error("    Then run: node get-test-token.js --api-key=YOUR_KEY\n");
    process.exit(1);
  }

  const data = await response.json();
  const idToken = data.idToken;

  console.log("   ✓ Got real Firebase ID token!");
  console.log(`   ✓ Token length: ${idToken.length} chars`);
  console.log(`   ✓ Expires in: ~3600 seconds`);

  // Print the token and curl command
  console.log("\n" + "─".repeat(60));
  console.log("🎯  YOUR FIREBASE ID TOKEN:\n");
  console.log(idToken);

  console.log("\n" + "─".repeat(60));
  console.log("📋  COPY-PASTE THIS CURL COMMAND:\n");
  console.log(`curl -X POST http://localhost:3001/auth/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${idToken}"`);

  console.log("\n" + "─".repeat(60));
  console.log("✅  Done! This token is valid for ~1 hour.\n");

  await admin.app().delete();
}

/**
 * Gets the Web API Key for the Firebase project.
 * First checks for --api-key CLI arg, then tries to fetch from Firebase Management API.
 */
async function getWebApiKey(projectId) {
  // Check for CLI arg
  const apiKeyFlag = process.argv.find((a) => a.startsWith("--api-key="))?.split("=")[1];
  if (apiKeyFlag) return apiKeyFlag;

  // Try to get it from Firebase Management API using the admin credential
  try {
    const credential = admin.credential.cert(serviceAccount);
    const accessToken = (await credential.getAccessToken()).access_token;

    const res = await fetch(
      `https://firebase.googleapis.com/v1beta1/projects/${projectId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (res.ok) {
      const project = await res.json();
      // The web API key is part of the project resources
      if (project.resources?.webApiKey) {
        console.log("   ✓ Auto-detected Web API Key");
        return project.resources.webApiKey;
      }
    }
  } catch (e) {
    // Fall through to manual instruction
  }

  console.error("❌  Could not auto-detect Web API Key.");
  console.error("    Find it at: Firebase Console → Project Settings → General → Web API Key");
  console.error("    Then run: node get-test-token.js --api-key=YOUR_WEB_API_KEY");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
