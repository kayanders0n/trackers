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

module.exports = router;