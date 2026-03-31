const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM BOOKING");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, user, court, slot, status } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO BOOKING VALUES(:1,SYSDATE,:2,:3,:4,:5)`,
    [id, status, user, court, slot],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Booking inserted successfully" });
});

// PUT - update editable booking fields (not Booking_ID, User_ID, Court_ID, Slot_Number)
router.put("/:id", async (req, res) => {
  const { status } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE BOOKING SET Booking_Status=:1 WHERE Booking_ID=:2`,
    [status, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Booking updated successfully" });
});

// DELETE - cascade: delete payment first, then booking
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM PAYMENT WHERE Booking_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.execute(`DELETE FROM BOOKING WHERE Booking_ID=:1`, [req.params.id], { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: "Booking and linked payment deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
