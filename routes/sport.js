const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM SPORT");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, name, players, rules } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO SPORT VALUES(:1,:2,:3,:4)`,
    [id, name, players, rules],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Sport inserted successfully" });
});

// PUT - update editable sport fields (not Sport_ID)
router.put("/:id", async (req, res) => {
  const { name, players, rules } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE SPORT SET Sport_Name=:1, Required_Players=:2, Rules=:3 WHERE Sport_ID=:4`,
    [name, players, rules, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Sport updated successfully" });
});

// DELETE - cascade: remove court_sport mappings first
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM COURT_SPORT WHERE Sport_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.execute(`DELETE FROM SPORT WHERE Sport_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: "Sport deleted successfully" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
