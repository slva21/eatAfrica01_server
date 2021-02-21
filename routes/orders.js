const express = require("express");
const sellerAuth = require("../middleware/sellerAuth");
const { Orders } = require("../models/orders");
const { Users } = require("../models/users");
const router = express.Router();

router.post("/createOrder", async (req, res) => {
  try {
    const user = await Users.findById(req.body.userId);

    let newOrder = new Orders({
      ...user.cart,
      deliveryNote: req.body.deliveryNote,
      orderNumber: `000${await Orders.count()}`,
      customerId: user._id,
    });
    newOrder.items = req.body.items;

    newOrder.time = newOrder.getCurrentTime();

    newOrder = await newOrder.save();

    res.status(201).send(newOrder);
  } catch (err) {
    console.log(err.message);
  }
});

//this route will set the order status to paid and respond by sending the order
router.get("/paid/:orderId", async (req, res) => {
  try {
    const order = await Orders.findById(req.params.orderId)
      .populate("customerId", ["name", "email"])
      .populate("kitchen", ["storeName", "contact", "address"]);

    if (!order) {
      res.status(404).send("order not found");
      return;
    }

    order.status = 2;

    //overwrites....
    order.date = new Date(Date.now()).toLocaleDateString();
    order.time = order.getCurrentTime();

    await order.save();

    res.status(200).send(order);
  } catch (err) {
    res
      .status(404)
      .send(
        "possible reason: argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
      );
  }
});

router.get("/:orderId", async (req, res) => {
  try {
    let order = await Orders.findById(req.params.orderId)
      .populate("kitchen", ["storeName", "contact"])
      .populate("customerId", ["name", "address", "contact"]);

    if (!order) return res.status(404).send("Order not found");

    //manually populate the current options
    // order.items.forEach(({ menu }) => {
    //   menu.populatedOptions = [];
    //   menu.options.forEach((_id) => {
    //     const populated = menu._id.options.find(
    //       ({ id }) => id.toString() === _id.toString()
    //     );

    //     menu.populatedOptions.push(populated);
    //   });
    // });

    res.status(200).json(order);
  } catch (err) {
    console.log(err.message);
  }
});

router.patch("/addSessionId", async (req, res) => {
  try {
    const order = await Orders.findById(req.body.orderId, {
      stripeSessionId: 1,
    });

    order.stripeSessionId = req.body.sessionId;

    await order.save();

    res.status(202).send("sessionId saved");
  } catch (err) {
    console.log(err);
  }
});

router.patch("/addOrderToUser", async (req, res) => {
  try {
    const user = await Users.findById(req.body.userId, {
      orders: 1,
    });

    let order = user.orders.find(
      (order) => order.toString() === req.body.orderId.toString()
    );

    if (order) return res.status(400).send("Already in Array");

    user.orders.push(req.body.orderId);

    await user.save();
  } catch (err) {
    console.log(err);
  }
});

router.patch("/addETA", sellerAuth, async (req, res) => {
  try {
    let order = await Orders.findById(req.body.orderId);
    order.ETA.time = req.body.time;
    order.ETA.date = req.body.date || new Date(Date.now()).toLocaleDateString();

    await order.save();
    res.status(202).json({
      date: order.ETA.date,
      time: order.ETA.time,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
