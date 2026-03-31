const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM STAFF");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, name, role, court } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO STAFF VALUES(:1,:2,:3,:4)`,
    [id, name, role, court],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Staff member inserted successfully" });
});

// PUT - update editable staff fields (not Staff_ID, Court_ID which is FK)
router.put("/:id", async (req, res) => {
  const { name, role } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE STAFF SET Staff_Name=:1, Role=:2 WHERE Staff_ID=:3`,
    [name, role, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Staff member updated successfully" });
});

// DELETE - cascade: remove staff contacts first
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM STAFF_CONTACT WHERE Staff_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.execute(`DELETE FROM STAFF WHERE Staff_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: "Staff member and contacts deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
