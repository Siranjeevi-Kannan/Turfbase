const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM FEEDBACK");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, user, rating, comments } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO FEEDBACK VALUES(:1,:2,:3,SYSDATE,:4)`,
    [id, rating, comments, user],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Feedback submitted successfully" });
});

// PUT - update editable feedback fields (not Feedback_ID or User_ID)
router.put("/:id", async (req, res) => {
  const { rating, comments } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE FEEDBACK SET Rating=:1, Comments=:2 WHERE Feedback_ID=:3`,
    [rating, comments, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Feedback updated successfully" });
});

// DELETE - simple, no children
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM FEEDBACK WHERE Feedback_ID=:1`, [req.params.id], { autoCommit: true });
    res.json({ success: true, message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
