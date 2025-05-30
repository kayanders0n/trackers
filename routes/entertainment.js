const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");


// --- MOVIE QUERIES ---

// API route to fetch movies from Firebird
router.get("/getMovies", async (req, res) => {
  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ID, DESCRIPT FROM ITEM ORDER BY DESCRIPT",
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
      "SELECT ID, DESCRIPT FROM GENRE ORDER BY DESCRIPT",
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

// API route to fetch genres for selected movie from Firebird
router.get("/getMovieGenres", async (req, res) => {
  const movieId = parseInt(req.query.movieId); // <-- grab from URL

  if (isNaN(movieId)) {
    return res.status(400).json({ error: "Missing movieId" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT ITEMGENRE.ITEMID, ITEMGENRE.GENREID, ITEMGENRE.ORDERID, GENRE.DESCRIPT FROM ITEMGENRE LEFT OUTER JOIN GENRE ON (ITEMGENRE.GENREID = GENRE.ID) WHERE ITEMGENRE.ITEMID = ? ORDER BY ITEMGENRE.ORDERID",
      [movieId], // Pass value safely into query
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
  Firebird.query(
    "SELECT GENREID, ORDERID FROM ITEMGENRE WHERE ITEMID = ?",
    [movieId],
    (err, existingRows) => {
      if (err) {
        Firebird.detach();
        return res.status(500).json({ error: "Failed to fetch current genres: " + err.message });
      }

      const existingMap = new Map(); // key: genreId, value: orderId
      existingRows.forEach(row => {
        existingMap.set(row.GENREID, row.ORDERID);
      });

      const incomingMap = new Map(); // key: genreId, value: orderId
      updates.forEach(u => {
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
        Firebird.query(
          "DELETE FROM ITEMGENRE WHERE ITEMID = ? AND GENREID = ?",
          [movieId, genreId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to delete genre: " + err.message });
            }
            doDeletes(i + 1);
          }
        );
      };

      const doUpdates = (i) => {
        if (i >= toUpdate.length) return doInserts(0);
        const { genreId, orderId } = toUpdate[i];
        Firebird.query(
          "UPDATE ITEMGENRE SET ORDERID = ? WHERE ITEMID = ? AND GENREID = ?",
          [orderId, movieId, genreId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to update order: " + err.message });
            }
            doUpdates(i + 1);
          }
        );
      };

      const doInserts = (i) => {
        if (i >= toInsert.length) {
          Firebird.detach();
          return res.json({ success: true });
        }

        const { genreId, orderId } = toInsert[i];
        Firebird.query(
          "INSERT INTO ITEMGENRE (ITEMID, GENREID, ORDERID) VALUES (?, ?, ?)",
          [movieId, genreId, orderId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to insert genre: " + err.message });
            }
            doInserts(i + 1);
          }
        );
      };

      doDeletes(0); // Begin processing
    }
  );
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
    Firebird.query(
      "UPDATE ITEM SET ORDERID = ? WHERE ID = ?",
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

// API route to fetch platforms for selected movie from Firebird
router.get("/getMoviePlatforms", async (req, res) => {
  const movieId = parseInt(req.query.movieId); // <-- grab from URL

  if (isNaN(movieId)) {
    return res.status(400).json({ error: "Missing movieId" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT PLATFORMS.ITEMID, PLATFORMS.ENTITYID, PLATFORMS.ORDERID, ENTITY.DESCRIPT FROM PLATFORMS LEFT OUTER JOIN ENTITY ON (PLATFORMS.ENTITYID = ENTITY.ID) WHERE PLATFORMS.ITEMID = ? ORDER BY PLATFORMS.ORDERID",
      [movieId], // Pass value safely into query
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

  Firebird.query(
    "SELECT ENTITYID, ORDERID FROM PLATFORMS WHERE ITEMID = ?",
    [movieId],
    (err, existingRows) => {
      if (err) {
        Firebird.detach();
        return res.status(500).json({ error: "Failed to fetch current platforms: " + err.message });
      }

      const existingMap = new Map();
      existingRows.forEach(row => {
        existingMap.set(row.ENTITYID, row.ORDERID);
      });

      const incomingMap = new Map();
      updates.forEach(u => {
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
        Firebird.query(
          "DELETE FROM PLATFORMS WHERE ITEMID = ? AND ENTITYID = ?",
          [movieId, platformId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to delete platform: " + err.message });
            }
            doDeletes(i + 1);
          }
        );
      };

      const doUpdates = (i) => {
        if (i >= toUpdate.length) return doInserts(0);
        const { platformId, orderId } = toUpdate[i];
        Firebird.query(
          "UPDATE PLATFORMS SET ORDERID = ? WHERE ITEMID = ? AND ENTITYID = ?",
          [orderId, movieId, platformId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to update platform: " + err.message });
            }
            doUpdates(i + 1);
          }
        );
      };

      const doInserts = (i) => {
        if (i >= toInsert.length) {
          Firebird.detach();
          return res.json({ success: true });
        }

        const { platformId, orderId } = toInsert[i];
        Firebird.query(
          "INSERT INTO PLATFORMS (ITEMID, ENTITYID, ORDERID) VALUES (?, ?, ?)",
          [movieId, platformId, orderId],
          (err) => {
            if (err) {
              Firebird.detach();
              return res.status(500).json({ error: "Failed to insert platform: " + err.message });
            }
            doInserts(i + 1);
          }
        );
      };

      doDeletes(0); // start the chain
    }
  );
});




module.exports = router;