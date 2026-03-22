import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = admin.firestore(firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real email sending endpoint
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, content } = req.body;
    
    try {
      // Fetch email settings from Firestore
      const settingsDoc = await db.collection('settings').doc('email').get();
      
      if (!settingsDoc.exists) {
        return res.status(400).json({ success: false, message: "Email settings not configured in Admin Panel" });
      }
      
      const settings = settingsDoc.data();
      
      if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
        return res.status(400).json({ success: false, message: "SMTP settings are incomplete" });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort) || 587,
        secure: settings.smtpPort === '465', // true for 465, false for other ports
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });

      // Send email
      await transporter.sendMail({
        from: `"${settings.senderName || 'Mzansi Web Solutions'}" <${settings.senderEmail || settings.smtpUser}>`,
        to,
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>'), // Simple text to html conversion
      });

      console.log(`Email sent successfully to ${to}`);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ success: false, message: "Failed to send email", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Mock inbound email simulation
  app.post("/api/simulate-inbound", (req, res) => {
    const { from, subject, content } = req.body;
    console.log(`Received inbound email from ${from}: ${subject}`);
    res.json({ success: true, message: "Inbound email simulated" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", // Vite handles SPA fallback automatically with this
    });
    app.use(vite.middlewares);
    
    // Fallback for development if vite.middlewares doesn't catch it
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
