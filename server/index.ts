import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// AL SAQAR SMOKING SHOP — production static server.
// This project is a static React SPA (WhatsApp-first ordering, no accounts,
// no database). This server only exists as a convenience for hosts that run
// Node instead of pure static hosting. For Vercel / Netlify / Cloudflare
// Pages, you can deploy the `dist/public` folder directly and this file is
// not required at all.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  const staticPath = path.resolve(__dirname, "public");

  app.use(express.static(staticPath, { maxAge: "1h" }));

  // Client-side routing (wouter) - serve index.html for any non-file route.
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, () => {
    console.log(`AL SAQAR server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
