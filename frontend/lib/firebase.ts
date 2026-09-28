/**
 * Firebase initialization (client SDK).
 * --------------------------------------
 * Uses the Realtime Database in the asia-southeast1 region. The
 * `getFirebaseApp()` helper is idempotent so HMR / multiple imports
 * during development don't crash with "Firebase app already exists".
 *
 * Database tree
 * -------------
 *   /qxl_keys/{pushId}     QXL keys generated from the admin panel
 *     - key        : string  (e.g. "QXL-AB12-CD34-EF56")
 *     - tier       : "smart" | "pro" | "dominator"
 *     - status     : "unused" | "used"
 *     - createdAt  : number  (ms epoch)
 *     - usedBy     : { fullName, username }   (optional)
 *     - usedAt     : number                   (optional)
 *
 *   /purchases/{pushId}    Submissions from the public purchase form
 *     - tierName   : string
 *     - orderId    : string
 *     - amount     : string
 *     - fullName   : string
 *     - email      : string
 *     - telegram   : string
 *     - note       : string
 *     - status     : "pending" | "approved" | "rejected"
 *     - submittedAt: number
 *     - assignedKey: string  (optional — set when admin approves)
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getDatabase, type Database } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyDJwd--OYsfETN0jOrugQCpGBBIx0B6-8w",
  authDomain: "qx-live-iamhear.firebaseapp.com",
  databaseURL:
    "https://qx-live-iamhear-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "qx-live-iamhear",
  storageBucket: "qx-live-iamhear.firebasestorage.app",
  messagingSenderId: "419660531743",
  appId: "1:419660531743:web:c02d21e78c55db9e6eed2a",
  measurementId: "G-MWD4V6MCM9",
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getDb(): Database {
  return getDatabase(getFirebaseApp())
}
