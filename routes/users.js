const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");

// Hardcoded user ID for now
const USER_ID = 1;

// --- USER QUERIES ---

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

// --- USER LIST QUERIES ---

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
      SELECT USERLIST.ID AS listId, USERLIST.DESCRIPT AS listName,
        CASE WHEN EXISTS (
          SELECT 1 FROM USERLISTITEMS
          WHERE USERLISTITEMS.USERLISTID = USERLIST.ID AND USERLISTITEMS.TITLEID = ?
        ) THEN 1 ELSE 0 END AS inList
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

module.exports = router;