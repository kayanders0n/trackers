const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");

// Hardcoded user ID for now
const USER_ID = 1;

// --- USER LIST QUERIES ---

// API route to fetch Titles from Firebird
router.get("/:userId/lists", async (req, res) => {
  const userId = parseInt(req.params.userId) || USER_ID;
  const typeId = parseInt(req.query.typeId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if (isNaN(typeId)) {
    return res.status(400).json({ error: "Missing typeId" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT USERLIST.ID, USERLIST.DESCRIPT, USERLIST.LISTTYPEID, COUNT(USERLISTITEMS.ID) AS ITEM_COUNT FROM USERLIST LEFT JOIN USERLISTITEMS ON (USERLISTITEMS.USERLISTID = USERLIST.ID) WHERE USERLIST.USERID = ? AND USERLIST.TYPEID = ? GROUP BY USERLIST.ID, USERLIST.LISTTYPEID, USERLIST.DESCRIPT ORDER BY USERLIST.LISTTYPEID NULLS LAST, USERLIST.DESCRIPT NULLS LAST",
      [userId, typeId], // Pass values safely into query
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

// API route to fetch User Lists and Title Membership Status from Firebird
router.get("/:userId/lists/list-status", async (req, res) => {
  const userId = parseInt(req.params.userId) || USER_ID;
  const titleId = parseInt(req.query.titleId);
  const typeId = parseInt(req.query.typeId); // 6 for entertainment, 1 for books

  if (isNaN(userId) || isNaN(titleId) || isNaN(typeId)) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    const query = `
      SELECT USERLIST.ID AS LISTID, USERLIST.DESCRIPT AS LISTNAME,
        CASE WHEN EXISTS (
          SELECT 1 FROM USERLISTITEMS
          WHERE USERLISTITEMS.USERLISTID = USERLIST.ID AND USERLISTITEMS.TITLEID = ?
        ) THEN 1 ELSE 0 END AS INLIST
      FROM USERLIST
      WHERE USERLIST.USERID = ? AND USERLIST.TYPEID = ?
      ORDER BY USERLIST.LISTTYPEID DESC NULLS LAST, USERLIST.DESCRIPT NULLS LAST
    `;

    Firebird.query(query, [titleId, userId, typeId], (err, result) => {
      if (err) {
        Firebird.detach();
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
      Firebird.detach();
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API route to fetch User Lists and Title Membership Status from Firebird
router.put("/:userId/titles/:titleId/lists", async (req, res) => {
  const userId  = parseInt(req.params.userId, 10) || USER_ID;
  const titleId = parseInt(req.params.titleId, 10);
  const { listIds, typeId } = req.body || {};

  if (isNaN(userId) || isNaN(titleId) || !Array.isArray(listIds)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  let db;
  try {
    db = await getFirebirdClient(); // returns a db connection (not a tx wrapper)
    if (!db) return res.status(500).json({ error: "Failed to connect to Firebird" });

    // small promise wrapper for db.query
    const q = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
      });

    // 1) current memberships for this user/title (optionally filter by type)
    const currentRows = await q(
      `
        SELECT UL.ID AS LISTID
        FROM USERLIST UL
        WHERE UL.USERID = ?
          /* include type only if provided */
          ${typeId ? "AND UL.TYPEID = ?" : ""}
          AND EXISTS (
            SELECT 1
            FROM USERLISTITEMS ULI
            WHERE ULI.USERLISTID = UL.ID
              AND ULI.TITLEID = ?
          )
      `,
      typeId ? [userId, typeId, titleId] : [userId, titleId]
    );

    const currentSet = new Set(currentRows.map(r => Number(r.LISTID)));
    const desiredSet = new Set(listIds.map(Number).filter(Boolean));

    const toAdd = [];
    const toRemove = [];
    for (const id of desiredSet) if (!currentSet.has(id)) toAdd.push(id);
    for (const id of currentSet) if (!desiredSet.has(id)) toRemove.push(id);

    // 2) inserts (trigger fills ID/SORTORDER/CREATEDON)
    for (const listId of toAdd) {
      await q(`INSERT INTO USERLISTITEMS (USERLISTID, TITLEID) VALUES (?, ?)`, [listId, titleId]);
    }

    // 3) deletes (single statement if there are any)
    if (toRemove.length) {
      const placeholders = toRemove.map(() => "?").join(", ");
      await q(
        `DELETE FROM USERLISTITEMS WHERE TITLEID = ? AND USERLISTID IN (${placeholders})`,
        [titleId, ...toRemove]
      );
    }

    return res.json({
      added: toAdd,
      removed: toRemove,
      unchanged: [...desiredSet].filter(id => !toAdd.includes(id))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save list changes" });
  } finally {
    try { db && db.detach(); } catch (_) {}
  }
});

module.exports = router;