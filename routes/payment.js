const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM PAYMENT");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { id, amount, method, status, booking } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO PAYMENT VALUES(:1,SYSDATE,:2,:3,:4,:5)`,
    [id, amount, method, status, booking],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Payment recorded successfully" });
});

// PUT - update editable payment fields (not Payment_ID, Booking_ID)
router.put("/:id", async (req, res) => {
  const { amount, method, status } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE PAYMENT SET Amount=:1, Payment_Method=:2, Payment_Status=:3 WHERE Payment_ID=:4`,
    [amount, method, status, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "Payment updated successfully" });
});

// DELETE - simple, no children
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM PAYMENT WHERE Payment_ID=:1`, [req.params.id], { autoCommit: true });
    res.json({ success: true, message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
