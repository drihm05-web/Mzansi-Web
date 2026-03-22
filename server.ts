import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes go here if needed
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock email sending endpoint
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, content } = req.body;
    console.log(`Sending email to ${to}: ${subject}`);
    // In a real app, you'd use a service like SendGrid here
    // For now, we'll simulate a successful send
    res.json({ success: true, message: "Email sent successfully" });
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
      appType: "spa",
    });
    app.use(vite.middlewares);
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
