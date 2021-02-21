const express = require("express");
const app = express();
const mongoose = require("mongoose");
const sellers = require("./routes/sellers");
const authSellers = require("./routes/auth-seller");
const fileUpload = require("express-fileupload");
const menus = require("./routes/menus");
const cities = require("./routes/cities");
const origins = require("./routes/origins");
const cart = require("./routes/cart");
const users = require("./routes/users");
const stripe = require("./routes/stripe");
const orders = require("./routes/orders");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv/config");

mongoose.connect(
  process.env.mongoDB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },

  () => console.log("connected to DB..")
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://:192.168.0.55:3000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// app.use(express.json());

// app.use(
//   express.urlencoded({
//     extended: false,
//   })
// );
app.use(
  bodyParser.json({
    limit: "10mb",
    extended: true,
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
  })
);
app.use(
  fileUpload({
    // limits: {
    //   fileSize: 50 * 1024 * 1024,
    // },
  })
);

app.use(cors());

app.use("/api/authsellers", authSellers);
app.use("/api/sellers", sellers);
app.use("/api/menus", menus);
app.use("/api/cities", cities);
app.use("/api/origins", origins);
app.use("/api/users", users);
app.use("/api/cart", cart);
app.use("/api/stripe", stripe);
app.use("/api/orders", orders);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
