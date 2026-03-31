const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM COURT");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, name, block, floor, capacity, rate, status } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO COURT VALUES(:1,:2,:3,:4,:5,:6,:7)`,
    [id, name, block, floor, capacity, rate, status],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Court inserted successfully" });
});

// PUT - update editable court fields (not Court_ID)
router.put("/:id", async (req, res) => {
  const { name, block, floor, capacity, rate, status } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE COURT SET Court_Name=:1, Block=:2, Floor=:3, Capacity=:4, Rate=:5, Status=:6
     WHERE Court_ID=:7`,
    [name, block, floor, capacity, rate, status, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Court updated successfully" });
});

// DELETE - cascade: payments -> bookings -> slots -> court_sport -> staff_contact -> staff -> court
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    const cid = req.params.id;
    // 1. Payments for bookings tied to this court
    await conn.execute(
      `DELETE FROM PAYMENT WHERE Booking_ID IN (SELECT Booking_ID FROM BOOKING WHERE Court_ID=:1)`,
      [cid], { autoCommit: false }
    );
    // 2. Bookings
    await conn.execute(`DELETE FROM BOOKING WHERE Court_ID=:1`, [cid], { autoCommit: false });
    // 3. Slots
    await conn.execute(`DELETE FROM SLOT WHERE Court_ID=:1`, [cid], { autoCommit: false });
    // 4. Court-sport mappings
    await conn.execute(`DELETE FROM COURT_SPORT WHERE Court_ID=:1`, [cid], { autoCommit: false });
    // 5. Staff contacts for staff at this court
    await conn.execute(
      `DELETE FROM STAFF_CONTACT WHERE Staff_ID IN (SELECT Staff_ID FROM STAFF WHERE Court_ID=:1)`,
      [cid], { autoCommit: false }
    );
    // 6. Staff
    await conn.execute(`DELETE FROM STAFF WHERE Court_ID=:1`, [cid], { autoCommit: false });
    // 7. Court
    await conn.execute(`DELETE FROM COURT WHERE Court_ID=:1`, [cid], { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: "Court and all related records deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
