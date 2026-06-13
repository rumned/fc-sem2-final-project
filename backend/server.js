const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const dotenv  = require("dotenv");

dotenv.config();

const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes      = require("./routes/auth");
const userRoutes      = require("./routes/users");
const eventRoutes     = require("./routes/events");
const calendarRoutes  = require("./routes/calendars");
const inviteRoutes    = require("./routes/invites");

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// Explicitly handle CORS preflight OPTIONS requests globally
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200 // Responds with 200 OK to preflight instead of 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Ensures preflight OPTIONS requests for ALL routes pass CORS

// Parse JSON bodies
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/events",    eventRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/invites",   inviteRoutes);

// Health check — useful for Render to verify the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// ── Global error handler (must be BEFORE catch-all or handled properly) ──────
// If a route throws an error, we want the errorHandler 
// to catch it first and safely return a JSON response with CORS intact.
app.use(errorHandler);

// Catch-all for unknown routes (Moved below error handler or kept as final fallback)
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});