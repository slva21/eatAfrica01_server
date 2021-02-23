const express = require("express");
const _ = require("lodash");
const fileUpload = require("express-fileupload");
const ObjectID = require("mongodb").ObjectID;
const fs = require("fs");
const { Sellers } = require("../models/sellers");
const sellerAuth = require("../middleware/sellerAuth");
const { Mongoose } = require("mongoose");
const { Orders } = require("../models/orders");

const stripe = require("stripe")(
  "sk_test_51HQJy6BM729ohvyiwM2urlGwhJ3qrtBoWpwPytnxQCqFCbxhGo03Efrm8xUcN2spYM1qaOa9uWch74W1ne3CElc300B7UjCrtR"
);

const router = express.Router();
require("dotenv/config");

//creating a new seller
router.post("/", async (req, res) => {
  const input = req.body;
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: req.body.email,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });

    let newSeller = new Sellers({
      password: input.password,
      email: input.email,
      name: input.name,
      stripeId: account.id,
      storeName: input.storeName,
      city: input.cityId,
      contact: input.contact,
      origin: input.originId,
    });

    //encrypting passwords
    newSeller.password = await newSeller.hashPassword();

    //................
    newSeller = await newSeller.save();
    const token = newSeller.generateJwtToken();

    res.header("x-seller-token", token);
    res
      .status(201)
      .send(
        _.pick(newSeller, [
          "storeName",
          "city",
          "origin",
          "description",
          "menu",
          "stars",
        ])
      );
  } catch (err) {
    console.log(err.message);
  }
});

//.........................................................................
//getting sellers excluding credentials and banner
router.get("/", async (req, res) => {
  try {
    let sellers = await Sellers.find(
      {},
      {
        banner: 0,
        password: 0,
        email: 0,
      }
    )
      .populate("city")
      .populate("origin", ["path", "name", "_id"])
      .populate("menu");
    if (!sellers) {
      return res.status(404).send("No sellers found");
    }

    res.status(200).send(sellers);
  } catch (err) {
    console.log(err.message);
  }
});

//getting a specific seller excluding credentials and banner
router.get("/:id", async (req, res) => {
  try {
    let seller = await Sellers.findOne(
      {
        _id: req.params.id,
      },
      {
        banner: 0,
        password: 0,
        email: 0,
      }
    )
      .populate("city")
      .populate("origin", ["path", "name", "_id"])
      .populate("menu", "-foodPic");
    if (!seller) {
      return res.status(404).send("No sellers found");
    }

    res.status(200).send(seller);
  } catch (err) {
    console.log(err.message);
  }
});

//getting a sellers banner image
router.get("/banner/:sellerId", async (req, res) => {
  try {
    fs.readFile(
      "./pictures/banners/" + req.params.sellerId,
      function (err, data) {
        if (err) {
          fs.readFile(
            "./pictures/placeHolders/restaurant",
            function (err, data) {
              if (err) throw err;
              res.writeHead(200, { "Content-Type": "image/jpeg" });
              res.end(data); // Send the file data to the browser.
            }
          );
          return;
        } // Fail if the file can't be read.
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data); // Send the file data to the browser.
      }
    );
  } catch (err) {
    console.log(err.message);
  }
});

//editing a sellers info................................

//edit banner
router.patch("/banner", sellerAuth, async (req, res) => {
  try {
    let banner = req.files.banner;

    banner.mv("./pictures/banners/" + req.body._id, function (err) {
      if (err) {
        res.send(err);
      } else {
        res.status(202).send("picture Saved");
      }
    });
  } catch (err) {
    console.log(err.message);
  }
});

router.patch("./pictures/food2Certificate", async (req, res) => {
  try {
    let foodHygiene2Certificate = req.files.foodHygiene2Certificate;

    foodHygiene2Certificate.mv(
      "./pictures/foodHygiene2Certificate/" + req.body._id,
      function (err) {
        if (err) {
          res.send(err);
        } else {
          res.status(202).send("picture Saved");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

//adding a menu
router.patch("/menu", sellerAuth, async (req, res) => {
  try {
    let seller = await Sellers.findById(req.body.seller_id, {
      banner: 0,
    });
    seller.menu.push(req.body.menuId);
    const saved = await seller.save();
    res.status(202).send(_.pick(saved, ["menu", "_id"]));
  } catch (err) {
    console.log(err.message);
  }
});

//leaving reviews
router.patch("/ratings/:sellerId", async (req, res) => {
  try {
    const seller = await Sellers.findById(req.params.sellerId, "-banner");
    seller.ratingAverage.numberOfReviews++;
    seller.ratingAverage.numberOfStars =
      seller.ratingAverage.numberOfStars + parseInt(req.body.stars);

    let stars =
      seller.ratingAverage.numberOfStars / seller.ratingAverage.numberOfReviews;
    seller.stars = Math.round(stars);

    const saved = await seller.save();
    res.status(201).send(_.pick(saved, ["stars"]));
  } catch (err) {
    console.log(err.message);
  }
});

//editing anything else
router.patch("/:id", sellerAuth, async (req, res) => {
  try {
    //check if user is an imposter
    let suspect = await Sellers.findById(req.params.id, {
      banner: 0,
    });

    //req.seller is the decoded web token passed by the sellerAuth middleware
    if (suspect._id.toString() !== req.seller.seller._id)
      return res.status(400).send("ERR: IMPOSTER ALERT");

    //imposter check passed...

    let seller = await Sellers.findByIdAndUpdate(req.params.id, req.body);
    if (req.body.password) {
      let Seller = new Sellers({
        password: req.body.password,
      });
      seller.password = await Seller.hashPassword();
    }

    const saved = await seller.save();
    res
      .status(202)
      .send(
        _.pick(saved, [
          "name",
          "storeName",
          "city",
          "contact",
          "origin",
          "description",
          "menu",
        ])
      );
  } catch (err) {
    console.log(err);
  }
});

router.patch("/addStoreNote/:id", sellerAuth, async (req, res) => {
  try {
    let suspect = await Sellers.findById(req.params.id, "_id");

    //req.seller is the decoded web token passed by the sellerAuth middleware
    if (suspect._id.toString() !== req.seller.seller._id)
      return res.status(400).send("ERR: IMPOSTER ALERT");

    let seller = await Sellers.findById(req.params.id, "storeNotes");

    if (seller.storeNotes.length === 3) {
      return res.status(400).send("Max notes reached");
    }

    seller.storeNotes.push({
      note: req.body.note,
      _id: new ObjectID(),
    });

    await seller.save();

    res.status(201).send(seller.storeNotes);
  } catch (err) {
    console.log(err);
  }
});

//get orders for that seller
router.get("/orders/:_id", async (req, res) => {
  try {
    const orders = await Orders.find({
      kitchen: req.params._id,
    })
      .populate("customerId", ["name", "address", "contact"]) //these need to be added to the order somehow... to be done!
      .sort({ _id: -1 });

    if (!orders) res.status(404).send("Orders not found");

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

router.patch("/deleteStoreNote/:id", sellerAuth, async (req, res) => {
  try {
    let suspect = await Sellers.findById(req.params.id, "_id");

    //req.seller is the decoded web token passed by the sellerAuth middleware

    if (suspect._id.toString() !== req.seller.seller._id)
      return res.status(400).send("ERR: IMPOSTER ALERT");

    let seller = await Sellers.findById(req.params.id, "storeNotes");

    seller.storeNotes = seller.storeNotes.filter(
      (m) => m._id.toString() !== req.body.noteId.toString()
    );

    await seller.save();

    res.status(200).send(seller.storeNotes);
  } catch (err) {
    console.log(err);
  }
});

//deleting sellers........................................

//deleting a sellers menu
router.patch("/delete-menu/:sellerId", async (req, res) => {
  try {
    let sellers;
    if (req.body.menuIndex !== "") {
      console.log("true");
      sellers = await Sellers.findById(req.params.sellerId);
      sellers.menu = sellers.menu.splice(req.body.menuIndex, 1);
      console.log(sellers.menu);

      await sellers.save();
      res.status(200).send("Menu Deleted");
    }
  } catch (err) {
    console.log(err.message);
  }
});

//deleting a whole user
router.delete("/seller/:id", async (req, res) => {
  try {
    const sellers = await Sellers.findByIdAndDelete(req.params.id);
    await sellers.save();
    res.status(203).send("seller Deleted");
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
