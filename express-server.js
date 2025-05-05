// Import required modules
const path = require("path");
const express = require("express");
const getFirebirdClient = require("./lib/node-firebird");

// Initialize Express app and set port
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html for root route "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API route to fetch friends from Firebird
app.get("/api/friends", async (req, res) => {
  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }
    // console.log("connected to firebird");
    Firebird.query("SELECT * FROM TYPE", (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
      Firebird.detach();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
