const express = require("express");
const router = express.Router();
const getFirebirdClient = require("../lib/node-firebird");

// Hardcoded user ID for now
const USER_ID = 1;

// --- USER QUERIES ---

// API route to fetch Titles from Firebird
router.get("/:userId/lists", async (req, res) => {
  const userId = parseInt(req.params.userId) || USER_ID;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT USERLIST.ID, USERLIST.DESCRIPT, COUNT(USERLISTITEMS.ID) AS ITEM_COUNT FROM USERLIST LEFT JOIN USERLISTITEMS ON (USERLISTITEMS.USERLISTID = USERLIST.ID) WHERE USERLIST.USERID = ? GROUP BY USERLIST.ID, USERLIST.LISTTYPEID, USERLIST.DESCRIPT ORDER BY USERLIST.LISTTYPEID NULLS LAST, USERLIST.DESCRIPT NULLS LAST",
      [userId], // Pass values safely into query
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