const express    = require("express");
const cors       = require("cors");
const bodyParser = require("body-parser");

const user     = require("./routes/user");
const court    = require("./routes/court");
const sport    = require("./routes/sport");
const booking  = require("./routes/booking");
const payment  = require("./routes/payment");
const staff    = require("./routes/staff");
const feedback = require("./routes/feedback");
const display  = require("./routes/display");
const slot     = require("./routes/slot");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/users",    user);
app.use("/courts",   court);
app.use("/sports",   sport);
app.use("/bookings", booking);
app.use("/payments", payment);
app.use("/staff",    staff);
app.use("/feedback", feedback);
app.use("/display",  display);
app.use("/slots",    slot);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
