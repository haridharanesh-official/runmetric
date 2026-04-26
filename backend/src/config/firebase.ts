import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault() // Requires GOOGLE_APPLICATION_CREDENTIALS env var
    // Or you can initialize with specific config
  });
}

export default admin;
