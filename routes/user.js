const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

// GET all users
router.get("/", async (req, res) => {
  const conn = await getConnection();
  const r = await conn.execute("SELECT * FROM USER_INFO");
  res.json(r.rows);
});

// POST - insert new user
router.post("/", async (req, res) => {
  const { id, fname, lname, email } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `INSERT INTO USER_INFO (User_ID, First_Name, Last_Name, Email, DOB, Date_Registered)
     VALUES(:1, :2, :3, :4, SYSDATE, SYSDATE)`,
    [id, fname, lname, email],
    { autoCommit: true }
  );
  res.json({ success: true, message: "User inserted successfully" });
});

// PUT - update any editable fields (not User_ID)
router.put("/:id", async (req, res) => {
  const { fname, lname, email } = req.body;
  const conn = await getConnection();
  await conn.execute(
    `UPDATE USER_INFO SET First_Name=:1, Last_Name=:2, Email=:3 WHERE User_ID=:4`,
    [fname, lname, email, req.params.id],
    { autoCommit: true }
  );
  res.json({ success: true, message: "User updated successfully" });
});

// DELETE - cascade: remove feedback, payments->bookings, phones, then user
router.delete("/:id", async (req, res) => {
  const conn = await getConnection();
  try {
    // 1. Delete payments linked to this user's bookings
    await conn.execute(
      `DELETE FROM PAYMENT WHERE Booking_ID IN (SELECT Booking_ID FROM BOOKING WHERE User_ID=:1)`,
      [req.params.id], { autoCommit: false }
    );
    // 2. Delete bookings
    await conn.execute(
      `DELETE FROM BOOKING WHERE User_ID=:1`,
      [req.params.id], { autoCommit: false }
    );
    // 3. Delete feedback
    await conn.execute(
      `DELETE FROM FEEDBACK WHERE User_ID=:1`,
      [req.params.id], { autoCommit: false }
    );
    // 4. Delete phone numbers
    await conn.execute(
      `DELETE FROM USER_PHONE WHERE User_ID=:1`,
      [req.params.id], { autoCommit: false }
    );
    // 5. Delete user
    await conn.execute(
      `DELETE FROM USER_INFO WHERE User_ID=:1`,
      [req.params.id], { autoCommit: false }
    );
    await conn.commit();
    res.json({ success: true, message: "User and all related records deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Delete failed: " + err.message });
  }
});

module.exports = router;
