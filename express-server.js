// Unhandled exception logging
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Module imports
const path = require("path");
const express = require("express");

// Express app setup
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Mount routes
const entertainmentRoutes = require("./routes/entertainment");
app.use("/api", entertainmentRoutes);
const booksRoutes = require("./routes/books");
app.use("/api", booksRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});