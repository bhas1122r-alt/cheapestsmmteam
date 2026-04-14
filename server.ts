import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf-8"));

// Initialize Firebase Client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Default values (will be overridden by Firestore settings if available)
let SMM_API_URL = "https://mainsmmteam.com/api/v2";
let SMM_API_KEY = "556ca9b7c77451f6d350881e5677830d67db75e7";

// Function to refresh SMM API settings from Firestore
async function refreshSmmSettings() {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'payment'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      if (data?.smmApiUrl) SMM_API_URL = data.smmApiUrl;
      if (data?.smmApiKey) SMM_API_KEY = data.smmApiKey;
      console.log("SMM API Settings refreshed from Firestore");
    }
  } catch (error) {
    console.error("Error refreshing SMM settings:", error);
  }
}

// Initial refresh
refreshSmmSettings();

// Refresh settings every 5 minutes
setInterval(refreshSmmSettings, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SMM API Endpoints
  app.get("/api/smm/services", async (req, res) => {
    try {
      const response = await axios.post(SMM_API_URL, {
        key: SMM_API_KEY,
        action: "services"
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("SMM API Error (Services):", error.message);
      res.status(500).json({ error: "Failed to fetch services from SMM API" });
    }
  });

  app.post("/api/smm/order", async (req, res) => {
    const { service, link, quantity } = req.body;
    try {
      const response = await axios.post(SMM_API_URL, {
        key: SMM_API_KEY,
        action: "add",
        service,
        link,
        quantity
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("SMM API Error (Order):", error.message);
      res.status(500).json({ error: "Failed to place order on SMM API" });
    }
  });

  app.get("/api/smm/status/:orderId", async (req, res) => {
    const { orderId } = req.params;
    try {
      const response = await axios.post(SMM_API_URL, {
        key: SMM_API_KEY,
        action: "status",
        order: orderId
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("SMM API Error (Status):", error.message);
      res.status(500).json({ error: "Failed to fetch order status from SMM API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
