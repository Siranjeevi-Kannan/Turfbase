const express = require("express");
const router  = express.Router();
const { getConnection } = require("../db");

/* GET /slots?court=C01&date=2024-03-05&avail=Available
   All params are optional — omit to get all slots. */
router.get("/", async (req, res) => {
  const { court, date, avail } = req.query;

  let sql    = "SELECT * FROM SLOT WHERE 1=1";
  const bind = [];
  let   i    = 1;

  if (court) { sql += ` AND Court_ID=:${i++}`;     bind.push(court); }
  if (avail) { sql += ` AND Availability=:${i++}`; bind.push(avail); }
  if (date)  {
    sql += ` AND Slot_Date=TO_DATE(:${i++},'YYYY-MM-DD')`;
    bind.push(date);
  }

  sql += " ORDER BY Court_ID, Slot_Number";

  try {
    const conn   = await getConnection();
    const result = await conn.execute(sql, bind);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* POST /slots — insert a new slot */
router.post("/", async (req, res) => {
  const { court, num, date, start, end, avail } = req.body;
  try {
    const conn = await getConnection();
    await conn.execute(
      `INSERT INTO SLOT VALUES(
        :1, :2,
        TO_DATE(:3,'YYYY-MM-DD'),
        TO_DATE(:4,'HH24:MI'),
        TO_DATE(:5,'HH24:MI'),
        :6
      )`,
      [court, num, date, start, end, avail],
      { autoCommit: true }
    );
    res.json({ success: true, message: "Slot inserted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* PUT /slots/:court/:num — update slot fields (not the composite PK) */
router.put("/:court/:num", async (req, res) => {
  const { avail, date, start, end } = req.body;
  const { court, num } = req.params;
  try {
    const conn = await getConnection();
    await conn.execute(
      `UPDATE SLOT SET
        Availability = :1,
        Slot_Date    = TO_DATE(:2,'YYYY-MM-DD'),
        Start_Time   = TO_DATE(:3,'HH24:MI'),
        End_Time     = TO_DATE(:4,'HH24:MI')
       WHERE Court_ID=:5 AND Slot_Number=:6`,
      [avail, date, start, end, court, parseInt(num)],
      { autoCommit: true }
    );
    res.json({ success: true, message: "Slot updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* DELETE /slots/:court/:num — cascade: payment → booking → slot */
router.delete("/:court/:num", async (req, res) => {
  const { court, num } = req.params;
  const conn = await getConnection();
  try {
    // 1. Payments for any booking on this slot
    await conn.execute(
      `DELETE FROM PAYMENT WHERE Booking_ID IN (
         SELECT Booking_ID FROM BOOKING
         WHERE Court_ID=:1 AND Slot_Number=:2
       )`,
      [court, parseInt(num)], { autoCommit: false }
    );
    // 2. The booking itself
    await conn.execute(
      `DELETE FROM BOOKING WHERE Court_ID=:1 AND Slot_Number=:2`,
      [court, parseInt(num)], { autoCommit: false }
    );
    // 3. The slot
    await conn.execute(
      `DELETE FROM SLOT WHERE Court_ID=:1 AND Slot_Number=:2`,
      [court, parseInt(num)], { autoCommit: false }
    );
    await conn.commit();
    res.json({ success: true, message: "Slot and linked booking/payment deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
