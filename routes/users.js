const express = require("express");
const { Users } = require("../models/users");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { Orders } = require("../models/orders");

router.post("/", async (req, res) => {
  try {
    let newUser = new Users({
      password: req.body.password,
      email: req.body.email,
      name: req.body.name,
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    const user = await Users.findOne({
      email: req.body.email,
    });

    if (user) {
      res.status(400).send("Email allready registered");
      return;
    }

    newUser = await newUser.save();

    const token = newUser.generateJwtToken();

    res.status(200).send(token);
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await Users.findOne({
      email: req.body.email,
    });

    if (!user) {
      res.status(400).send("hmm..Cant find that email here sorry...");
      return;
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).send("That password doesnt look right...");
    }

    const token = user.generateJwtToken();
    res.status(200).send(token);
  } catch (err) {
    console.log(err.message);
  }
});

//get the orders for that user
router.get("/orders/:_id", async (req, res) => {
  try {
    let orders = await Orders.find({
      customerId: req.params._id,
    })
      .populate("kitchen", ["storeName", "contact"])
      .sort({ _id: -1 });

    if (!orders) res.status(404).send("Orders not found");

    //filter the orders that have been paid
    orders = orders.filter(({ status }) => status > 1);

    //manually populate the current options
    // orders.forEach(({ items }) => {
    //   items.forEach(({ menu }) => {
    //     menu.populatedOptions = [];
    //     menu.options.forEach((_id) => {
    //       const populated = menu._id.options.find(
    //         ({ id }) => id.toString() === _id.toString()
    //       );
    //       menu.populatedOptions.push(populated);
    //     });
    //   });
    // });

    res.status(200).json(orders);
  } catch (err) {
    console.log(err.message);
  }
});

router.patch("/address", async (req, res) => {
  try {
    let user = await Users.findById(req.body.userId);

    if (!user) return res.status(404).json("no user found");

    let newAddress = {
      postcode: req.body.address.postcode,
      addressLine1: req.body.address.addressLine1,
      addressLine2: req.body.address.addressLine2,
      city: req.body.address.cityId,
    };

    user.address.push(newAddress);
    await user.save();

    res.status(201).json(newAddress);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
