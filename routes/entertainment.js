const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");

// --- ITEM QUERIES ---

// API route to fetch Items from Firebird
router.get("/getItems", async (req, res) => {
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
      SELECT ITEM.ID, ITEM.DESCRIPT, TYPECODES.DESCRIPT AS TYPENAME, ITEM.FIRSTRELEASE, ITEM.LENGTH, ITEM.IMAGEFILE
      FROM ITEM
      LEFT OUTER JOIN TYPECODES ON (ITEM.TYPEID = TYPECODES.ID)
      WHERE 1=1
    `;

    const params = [];

    // TYPEID: default to (2, 3) if null
    if (!isNaN(typeID)) {
      sql += ` AND ITEM.TYPEID = ?`;
      params.push(typeID);
    } else {
      sql += ` AND ITEM.TYPEID IN (2, 3)`;
    }

    // PLATFORM: only filter if platformID is provided
    if (!isNaN(platformID)) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM PLATFORM WHERE ITEMID = ITEM.ID AND ENTITYID = ?
        )
      `;
      params.push(platformID);
    }

    // STYLE: Animated = genreID 3 must exist
    if (styleID === 1) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM ITEMGENRE WHERE ITEMID = ITEM.ID AND GENREID = 3
        )
      `;
    } else if (styleID === 2) {
      // Live Action = genreID 3 must NOT exist
      sql += `
        AND NOT EXISTS (
          SELECT 1 FROM ITEMGENRE WHERE ITEMID = ITEM.ID AND GENREID = 3
        )
      `;
    }

    // GENREID: only filter if provided
    if (!isNaN(genreID)) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM ITEMGENRE WHERE ITEMID = ITEM.ID AND GENREID = ?
        )
      `;
      params.push(genreID);
    }

    sql += ` ORDER BY ITEM.DESCRIPT, TYPECODES.DESCRIPT, ITEM.FIRSTRELEASE NULLS LAST`;

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

// API route to add a new movie to Firebird
router.post("/insertMovie", async (req, res) => {
  const { movieTitle, releaseDate, runTimeTotalMin, seriesID, orderNum } = req.body;

  if (!movieTitle) {
    return res.status(400).json({ error: "Title is required" });
  }

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  const query = seriesID
    ? "INSERT INTO ITEM (TYPEID, UOMID, DESCRIPT, FIRSTRELEASE, LENGTH, SERIESID, ORDERID) VALUES (2, 2, ?, ?, ?, ?, ?)"
    : "INSERT INTO ITEM (TYPEID, UOMID, DESCRIPT, FIRSTRELEASE, LENGTH) VALUES (2, 2, ?, ?, ?)";

  const params = seriesID ? [movieTitle, releaseDate, runTimeTotalMin, seriesID, orderNum] : [movieTitle, releaseDate, runTimeTotalMin];

  // Runs the query
  Firebird.query(query, params, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Now fetch the max ID
    Firebird.query("SELECT MAX(ID) AS ID FROM ITEM", (err2, result) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ ID: result[0].ID });
      Firebird.detach();
    });
  });
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
router.get("/getItemGenres", async (req, res) => {
  const itemID = parseInt(req.query.itemID); // <-- grab from URL

  if (isNaN(itemID)) {
    return res.status(400).json({ error: "Missing itemID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ITEMGENRE.ITEMID, ITEMGENRE.GENREID, ITEMGENRE.ORDERID, GENRE.DESCRIPT FROM ITEMGENRE LEFT OUTER JOIN GENRE ON (ITEMGENRE.GENREID = GENRE.ID) WHERE ITEMGENRE.ITEMID = ? ORDER BY ITEMGENRE.ORDERID",
      [itemID], // Pass value safely into query
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

// API route to update the genres for a movie
router.post("/updateMovieGenres", async (req, res) => {
  const updates = req.body.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Invalid or empty request format" });
  }

  const movieId = updates[0].movieId;

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  // Step 1: Get existing genres for the movie
  Firebird.query("SELECT GENREID, ORDERID FROM ITEMGENRE WHERE ITEMID = ?", [movieId], (err, existingRows) => {
    if (err) {
      Firebird.detach();
      return res.status(500).json({ error: "Failed to fetch current genres: " + err.message });
    }

    const existingMap = new Map(); // key: genreId, value: orderId
    existingRows.forEach((row) => {
      existingMap.set(row.GENREID, row.ORDERID);
    });

    const incomingMap = new Map(); // key: genreId, value: orderId
    updates.forEach((u) => {
      incomingMap.set(u.genreId, u.orderId);
    });

    // Step 2: Determine changes
    const toInsert = [];
    const toUpdate = [];
    const toDelete = [];

    for (const [genreId, orderId] of incomingMap) {
      if (!existingMap.has(genreId)) {
        toInsert.push({ genreId, orderId });
      } else if (existingMap.get(genreId) !== orderId) {
        toUpdate.push({ genreId, orderId });
      }
    }

    for (const genreId of existingMap.keys()) {
      if (!incomingMap.has(genreId)) {
        toDelete.push(genreId);
      }
    }

    // Step 3: Apply changes recursively

    const doDeletes = (i) => {
      if (i >= toDelete.length) return doUpdates(0);
      const genreId = toDelete[i];
      Firebird.query("DELETE FROM ITEMGENRE WHERE ITEMID = ? AND GENREID = ?", [movieId, genreId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to delete genre: " + err.message });
        }
        doDeletes(i + 1);
      });
    };

    const doUpdates = (i) => {
      if (i >= toUpdate.length) return doInserts(0);
      const { genreId, orderId } = toUpdate[i];
      Firebird.query("UPDATE ITEMGENRE SET ORDERID = ? WHERE ITEMID = ? AND GENREID = ?", [orderId, movieId, genreId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to update order: " + err.message });
        }
        doUpdates(i + 1);
      });
    };

    const doInserts = (i) => {
      if (i >= toInsert.length) {
        Firebird.detach();
        return res.json({ success: true });
      }

      const { genreId, orderId } = toInsert[i];
      Firebird.query("INSERT INTO ITEMGENRE (ITEMID, GENREID, ORDERID) VALUES (?, ?, ?)", [movieId, genreId, orderId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to insert genre: " + err.message });
        }
        doInserts(i + 1);
      });
    };

    doDeletes(0); // Begin processing
  });
});

// --- SERIES QUERIES ---

// API route to fetch series from Firebird
router.get("/getSeries", async (req, res) => {
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

// API route to fetch series of title from Firebird
router.get("/getItemSeries", async (req, res) => {
  const itemID = parseInt(req.query.itemID); // <-- grab from URL

  if (isNaN(itemID)) {
    return res.status(400).json({ error: "Missing itemID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ITEM.SERIESID, SERIES.DESCRIPT FROM ITEM LEFT OUTER JOIN SERIES ON (ITEM.SERIESID = SERIES.ID) WHERE ITEM.ID = ? ORDER BY SERIES.DESCRIPT",
      [itemID], // Pass value safely into query
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

// API route to add a new series to Firebird
router.post("/insertSeries", async (req, res) => {
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
router.get("/getMoviesInSeries", async (req, res) => {
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
      "SELECT ITEM.ID, ITEM.DESCRIPT, TYPECODES.DESCRIPT AS TYPE, ITEM.ORDERID FROM ITEM LEFT OUTER JOIN TYPECODES ON (TYPECODES.ID = ITEM.TYPEID) WHERE ITEM.SERIESID = ? ORDER BY ITEM.ORDERID",
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
router.post("/updateMovieOrder", async (req, res) => {
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
    Firebird.query("UPDATE ITEM SET ORDERID = ? WHERE ID = ?", [ordernum, id], (err) => {
      if (err) {
        Firebird.detach();
        return res.status(500).json({ error: `Failed on ID ${id}: ${err.message}` });
      }
      updateNext(i + 1);
    });
  };

  updateNext(0); // Start recursive update
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
router.get("/getItemPlatforms", async (req, res) => {
  const itemID = parseInt(req.query.itemID); // <-- grab from URL

  if (isNaN(itemID)) {
    return res.status(400).json({ error: "Missing itemID" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT PLATFORM.ITEMID, PLATFORM.ENTITYID, PLATFORM.ORDERID, ENTITY.DESCRIPT FROM PLATFORM LEFT OUTER JOIN ENTITY ON (PLATFORM.ENTITYID = ENTITY.ID) WHERE PLATFORM.ITEMID = ? ORDER BY PLATFORM.ORDERID",
      [itemID], // Pass value safely into query
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

// API route to update the genres for a movie
router.post("/updateMoviePlatforms", async (req, res) => {
  const updates = req.body.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Invalid or empty request format" });
  }

  const movieId = updates[0].movieId;

  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  Firebird.query("SELECT ENTITYID, ORDERID FROM PLATFORMS WHERE ITEMID = ?", [movieId], (err, existingRows) => {
    if (err) {
      Firebird.detach();
      return res.status(500).json({ error: "Failed to fetch current platforms: " + err.message });
    }

    const existingMap = new Map();
    existingRows.forEach((row) => {
      existingMap.set(row.ENTITYID, row.ORDERID);
    });

    const incomingMap = new Map();
    updates.forEach((u) => {
      incomingMap.set(u.platformId, u.orderId);
    });

    const toInsert = [];
    const toUpdate = [];
    const toDelete = [];

    for (const [platformId, orderId] of incomingMap) {
      if (!existingMap.has(platformId)) {
        toInsert.push({ platformId, orderId });
      } else if (existingMap.get(platformId) !== orderId) {
        toUpdate.push({ platformId, orderId });
      }
    }

    for (const platformId of existingMap.keys()) {
      if (!incomingMap.has(platformId)) {
        toDelete.push(platformId);
      }
    }

    const doDeletes = (i) => {
      if (i >= toDelete.length) return doUpdates(0);
      const platformId = toDelete[i];
      Firebird.query("DELETE FROM PLATFORMS WHERE ITEMID = ? AND ENTITYID = ?", [movieId, platformId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to delete platform: " + err.message });
        }
        doDeletes(i + 1);
      });
    };

    const doUpdates = (i) => {
      if (i >= toUpdate.length) return doInserts(0);
      const { platformId, orderId } = toUpdate[i];
      Firebird.query("UPDATE PLATFORMS SET ORDERID = ? WHERE ITEMID = ? AND ENTITYID = ?", [orderId, movieId, platformId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to update platform: " + err.message });
        }
        doUpdates(i + 1);
      });
    };

    const doInserts = (i) => {
      if (i >= toInsert.length) {
        Firebird.detach();
        return res.json({ success: true });
      }

      const { platformId, orderId } = toInsert[i];
      Firebird.query("INSERT INTO PLATFORMS (ITEMID, ENTITYID, ORDERID) VALUES (?, ?, ?)", [movieId, platformId, orderId], (err) => {
        if (err) {
          Firebird.detach();
          return res.status(500).json({ error: "Failed to insert platform: " + err.message });
        }
        doInserts(i + 1);
      });
    };

    doDeletes(0); // start the chain
  });
});

module.exports = router;
