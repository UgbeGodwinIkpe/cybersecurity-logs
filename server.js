const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "data", "security-logs.json");

app.use(helmet());
app.use(cors()); // Public, read-only training data. Restrict origins if needed.
app.use(express.json({ limit: "100kb" }));

function loadDataset() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const dataset = JSON.parse(raw);
  if (!dataset || !Array.isArray(dataset.logs)) {
    throw new Error("Security log dataset must contain a logs array.");
  }
  return dataset;
}

app.get("/", (req, res) => {
  res.json({
    name: "Cybersecurity Security Logs API",
    description: "Fictional simulated security logs for classroom projects.",
    endpoints: {
      health: "/api/health",
      allLogs: "/api/security-logs",
      stats: "/api/security-logs/stats",
      singleLog: "/api/security-logs/:id"
    },
    note: "Training data only. No real customer or OPAY data."
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "cybersecurity-logs-api", timestamp: new Date().toISOString() });
});

// Keep /stats above /:id so Express does not treat "stats" as an ID.
app.get("/api/security-logs/stats", (req, res, next) => {
  try {
    const { logs } = loadDataset();
    const countBy = (key) => logs.reduce((acc, log) => {
      const value = log[key] ?? "unknown";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
    res.json({
      total: logs.length,
      by_event_type: countBy("event_type"),
      by_status: countBy("status"),
      by_severity: countBy("severity"),
      generated_at: new Date().toISOString()
    });
  } catch (err) { next(err); }
});

app.get("/api/security-logs", (req, res, next) => {
  try {
    const dataset = loadDataset();
    let logs = dataset.logs;
    const filters = ["event_type", "status", "severity", "ip_address", "user_id"];
    for (const field of filters) {
      if (req.query[field] !== undefined) {
        const value = String(req.query[field]).trim().toLowerCase();
        if (!value) return res.status(400).json({ error: `${field} filter cannot be empty.` });
        logs = logs.filter(log => String(log[field] ?? "").toLowerCase() === value);
      }
    }

    if (req.query.from || req.query.to) {
      const from = req.query.from ? Date.parse(req.query.from) : -Infinity;
      const to = req.query.to ? Date.parse(req.query.to) : Infinity;
      if ((req.query.from && Number.isNaN(from)) || (req.query.to && Number.isNaN(to))) {
        return res.status(400).json({ error: "Invalid from/to date. Use an ISO date, e.g. 2026-09-01." });
      }
      if (from > to) return res.status(400).json({ error: "'from' must be earlier than or equal to 'to'." });
      logs = logs.filter(log => {
        const time = Date.parse(log.timestamp);
        return time >= from && time <= to;
      });
    }

    const page = Number.parseInt(req.query.page ?? "1", 10);
    const limit = Number.parseInt(req.query.limit ?? "50", 10);
    if (!Number.isInteger(page) || page < 1) return res.status(400).json({ error: "page must be a positive integer." });
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      return res.status(400).json({ error: "limit must be an integer from 1 to 200." });
    }

    const total = logs.length;
    const start = (page - 1) * limit;
    const pageLogs = logs.slice(start, start + limit);
    res.json({
      dataset: dataset.application,
      simulated_data: true,
      period: dataset.period,
      pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
      logs: pageLogs
    });
  } catch (err) { next(err); }
});

app.get("/api/security-logs/:id", (req, res, next) => {
  try {
    const { logs } = loadDataset();
    const log = logs.find(item => item.id.toLowerCase() === String(req.params.id).toLowerCase());
    if (!log) return res.status(404).json({ error: "Security log not found.", id: req.params.id });
    res.json({ simulated_data: true, log });
  } catch (err) { next(err); }
});

// JSON 404 for unknown endpoints
app.use((req, res) => res.status(404).json({ error: "Endpoint not found.", path: req.path }));

// Central error handler; avoid exposing internal stack traces to API clients.
app.use((err, req, res, next) => {
  console.error("API error:", err.message);
  res.status(500).json({ error: "Unable to process the request. Check the server dataset and logs." });
});

app.listen(PORT, () => {
  console.log(`Cybersecurity Logs API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/security-logs`);
});
