const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");

// --- TITLE QUERIES ---

// API route to fetch Titles from Firebird
router.get("/getTitles", async (req, res) => {
  const platformID  = parseInt(req.query.platformID);
  const typeID      = parseInt(req.query.mediaID);
  const styleID     = parseInt(req.query.styleID);
  const genreID     = parseInt(req.query.genreID);

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Base Query
    let sql = `
      SELECT TITLE.ID, TITLE.DESCRIPT, TYPECODES.DESCRIPT AS TYPENAME, TITLE.FIRSTRELEASE, TITLE.CONTENT_SIZE, TITLE.IMAGEFILE
      FROM TITLE
      LEFT OUTER JOIN TYPECODES ON (TITLE.TYPEID = TYPECODES.ID)
      WHERE 1=1
    `;

    const params = [];

    // TYPEID: default to (2, 3) if null
    if (!isNaN(typeID)) {
      sql += ` AND TITLE.TYPEID = ?`;
      params.push(typeID);
    } else {
      sql += ` AND TITLE.TYPEID IN (2, 3)`;
    }

    // PLATFORM: only filter if platformID is provided
    if (!isNaN(platformID)) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM PLATFORM WHERE TITLEID = TITLE.ID AND ENTITYID = ?
        )
      `;
      params.push(platformID);
    }

    // STYLE: Animated = genreID 3 must exist
    if (styleID === 1) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM TITLEGENRE WHERE TITLEID = TITLE.ID AND GENREID = 3
        )
      `;
    } else if (styleID === 2) {
      // Live Action = genreID 3 must NOT exist
      sql += `
        AND NOT EXISTS (
          SELECT 1 FROM TITLEGENRE WHERE TITLEID = TITLE.ID AND GENREID = 3
        )
      `;
    }

    // GENREID: only filter if provided
    if (!isNaN(genreID)) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM TITLEGENRE WHERE TITLEID = TITLE.ID AND GENREID = ?
        )
      `;
      params.push(genreID);
    }

    sql += ` ORDER BY TITLE.DESCRIPT, TYPECODES.DESCRIPT, TITLE.FIRSTRELEASE NULLS LAST`;

    // Run the query
    Firebird.query(sql, params, (err, result) => {
      Firebird.detach();
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GENRE QUERIES ---

// API route to fetch movies from Firebird
router.get("/getGenres", async (req, res) => {
  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ID, DESCRIPT FROM GENRE WHERE ISENTERTAINMENT=1 ORDER BY DESCRIPT",
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

// API route to fetch genres for selected title from Firebird
router.get("/getTitleGenres", async (req, res) => {
  const titleID = parseInt(req.query.titleID); // <-- grab from URL

  if (isNaN(titleID)) {
    return res.status(400).json({ error: "Missing titleID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT TITLEGENRE.TITLEID, TITLEGENRE.GENREID, TITLEGENRE.ORDERID, GENRE.DESCRIPT FROM TITLEGENRE LEFT OUTER JOIN GENRE ON (TITLEGENRE.GENREID = GENRE.ID) WHERE TITLEGENRE.ITEMID = ? ORDER BY TITLEGENRE.ORDERID",
      [titleID], // Pass value safely into query
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

// --- SERIES QUERIES ---

// API route to fetch series of title from Firebird
router.get("/getTitleSeries", async (req, res) => {
  const titleID = parseInt(req.query.titleID); // <-- grab from URL

  if (isNaN(titleID)) {
    return res.status(400).json({ error: "Missing titleID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT TITLE.SERIESID, SERIES.DESCRIPT FROM TITLE LEFT OUTER JOIN SERIES ON (TITLE.SERIESID = SERIES.ID) WHERE TITLE.ID = ? ORDER BY SERIES.DESCRIPT",
      [titleID], // Pass value safely into query
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

// --- STREAMING PLATFORM QUERIES ---

// API route to fetch streaming platforms from Firebird
router.get("/getPlatforms", async (req, res) => {
  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  Firebird.query("SELECT ID, DESCRIPT FROM ENTITY WHERE TYPEID = 4 ORDER BY DESCRIPT", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
    Firebird.detach();
  });
});

// API route to fetch platforms for selected titles from Firebird
router.get("/getTitlePlatforms", async (req, res) => {
  const titleID = parseInt(req.query.titleID); // <-- grab from URL

  if (isNaN(titleID)) {
    return res.status(400).json({ error: "Missing titleID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT PLATFORM.TITLEID, PLATFORM.ENTITYID, PLATFORM.ORDERID, ENTITY.DESCRIPT FROM PLATFORM LEFT OUTER JOIN ENTITY ON (PLATFORM.ENTITYID = ENTITY.ID) WHERE PLATFORM.TITLEID = ? ORDER BY PLATFORM.ORDERID",
      [titleID], // Pass value safely into query
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

module.exports = router;