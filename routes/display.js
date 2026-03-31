const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");


/* COURT TABLE */

router.get("/courts", async (req, res) => {

    const conn = await getConnection();

    const result = await conn.execute(
        "SELECT * FROM COURT"
    );

    res.json(result.rows);

});


/* BOOKING TABLE */

router.get("/bookings", async (req, res) => {

    const conn = await getConnection();

    const result = await conn.execute(
        "SELECT * FROM BOOKING"
    );

    res.json(result.rows);

});


/* PAYMENT TABLE */

router.get("/payments", async (req, res) => {

    const conn = await getConnection();

    const result = await conn.execute(
        "SELECT * FROM PAYMENT"
    );

    res.json(result.rows);

});


/* STAFF TABLE */

router.get("/staff", async (req, res) => {

    const conn = await getConnection();

    const result = await conn.execute(
        "SELECT * FROM STAFF"
    );

    res.json(result.rows);

});

module.exports = router;