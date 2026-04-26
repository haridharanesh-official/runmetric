import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // For local development: fallback to file if env var is missing
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase initialized from environment variable.");
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault() // Requires GOOGLE_APPLICATION_CREDENTIALS env var
      });
      console.log("Firebase initialized from application default credentials.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export default admin;
