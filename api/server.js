import express from "express";
import profileRoute from "./routes/profile.js";
import heistsRoute from "./routes/heists.js";
import confidantsRoute from "./routes/confidants.js";

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || "*";

app.disable("x-powered-by");

// CORS minimal tanpa dependency (web mengambil data server-side, ini hanya jaga-jaga)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/api/profile", profileRoute);
app.use("/api/heists", heistsRoute);
app.use("/api/confidants", confidantsRoute);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
