// see if unhandled exceptions are crashing server
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Import required modules
const path = require("path");
const express = require("express");
const getFirebirdClient = require("./lib/node-firebird");

// Initialize Express app and set port
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve index.html for root route "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API route to fetch movies from Firebird
app.get("/api/movies", async (req, res) => {
  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT * FROM ITEM",
      // Callback function -- handles the response
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json(result);
        Firebird.detach();
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route to add a new movie to Firebird
app.post("/api/addMovie", async (req, res) => {
  const { movieTitle, releaseDate, runTimeTotalMin, seriesID, orderNum } = req.body;

  if (!movieTitle) {
    return res.status(400).json({ error: "Title is required" });
  }

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  const query = seriesID
    ? "INSERT INTO ITEM (TYPEID, UOMID, DESCRIPT, FIRSTRELEASE, LENGTH, SERIESID, ORDERNUM) VALUES (2, 2, ?, ?, ?, ?, ?)"
    : "INSERT INTO ITEM (TYPEID, UOMID, DESCRIPT, FIRSTRELEASE, LENGTH) VALUES (2, 2, ?, ?, ?)";

  const params = seriesID ? [movieTitle, releaseDate, runTimeTotalMin, seriesID, orderNum] : [movieTitle, releaseDate, runTimeTotalMin];

  // Runs the query
  Firebird.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
    Firebird.detach();
  });
});

// API route to fetch series from Firebird
app.get("/api/series", async (req, res) => {
  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  Firebird.query("SELECT ID, DESCRIPT FROM SERIES ORDER BY DESCRIPT", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
    Firebird.detach();
  });
});

// API route to add a new series to Firebird
app.post("/api/addSeries", async (req, res) => {
  const { newSeriesName } = req.body;

  if (!newSeriesName) {
    return res.status(400).json({ error: "Series Name is required" });
  }

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  Firebird.query("INSERT INTO SERIES (DESCRIPT) VALUES (?)", [newSeriesName], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Now fetch the max ID
    Firebird.query("SELECT MAX(ID) AS ID FROM SERIES", (err2, result) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ ID: result[0].ID });
      Firebird.detach();
    });
  });
});

// API route to fetch movies in selected series from Firebird
app.get("/api/movies-in-series", async (req, res) => {
  const seriesId = parseInt(req.query.seriesId); // <-- grab from URL

  if (isNaN(seriesId)) {
    return res.status(400).json({ error: "Missing seriesId" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ITEM.ID, ITEM.DESCRIPT, TYPECODES.DESCRIPT AS TYPE, ITEM.ORDERNUM FROM ITEM LEFT OUTER JOIN TYPECODES ON (TYPECODES.ID = ITEM.TYPEID) WHERE SERIESID = ? ORDER BY ORDERNUM",
      [seriesId], // Pass value safely into query
      // Callback function -- handles the response
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json(result);
        Firebird.detach();
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route to update the order of items in a series
app.post("/api/update-orders", async (req, res) => {
  const updates = req.body.updates;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Invalid request format" });
  }

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  const updateNext = (i) => {
    if (i >= updates.length) {
      Firebird.detach();
      return res.json({ success: true });
    }

    const { id, ordernum } = updates[i];
    Firebird.query(
      "UPDATE ITEM SET ORDERNUM = ? WHERE ID = ?",
      [ordernum, id],
      (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: `Failed on ID ${id}: ${err.message}` });
        }
        updateNext(i + 1);
      }
    );
  };

  updateNext(0); // Start recursive update
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
