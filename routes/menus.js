const express = require("express");
const { Menus } = require("../models/menus");
const router = express.Router();
const _ = require("lodash");
const fs = require("fs");
const sellerAuth = require("../middleware/sellerAuth");

router.post("/", async (req, res) => {
  const {
    title,
    description,
    ingredients,
    category,
    type,
    price,
    optionPrice,
    optionName,
    kitchen,
  } = req.body;
  try {
    let newMenu = new Menus({
      title: title,
      ingredients: ingredients,
      category: category,
      description: description,
      type: type,
      options: [
        {
          name: optionName,
          price: optionPrice,
        },
      ],
      price: price,
      kitchen: kitchen,
    });
    newMenu = await newMenu.save();
    newMenu = _.pick(newMenu, [
      "title",
      "ingredients",
      "category",
      "description",
      "type",
      "options",
      "price",
    ]);
    res.status(201).send(newMenu);
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

router.get("/", async (req, res) => {
  try {
    let menus = await Menus.find({}, "-foodPic");

    if (!menus || menus.length === 0) {
      res.status(404).send("No Menus found in the database");
    }
    res.status(200).send(menus);
  } catch (err) {
    res.status(500).send("something went wrong");
    console.log(err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    let menus = await Menus.findOne(
      {
        _id: req.params.id,
      }
      // "-foodPic"
    );

    if (!menus) {
      res.status(404).send("No Menus found in the database");
    }

    res.status(200).send(menus);
  } catch (err) {
    res.status(500).send("something went wrong");
    console.log(err.message);
  }
});
//get menu Image
router.get("/foodPic/:Id", async (req, res) => {
  try {
    const path = "./pictures/foodPics/" + req.params.Id;

    fs.readFile(path, function (err, data) {
      if (err) {
        // if file does not exist..
        fs.readFile(
          "./pictures/placeHolders/placeHolderFood1",
          function (err, data) {
            if (err) throw err;
            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(data); // Send the file data to the browser.
          }
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data); // Send the file data to the browser.
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//edit menu options --tested
// router.patch("/option", async (req, res) => {
//   try {
//     let menu = await Menus.findById(req.body.menu_id);
//     menu.options.push({
//       name: req.body.name,
//       price: req.body.price,
//     });
//     const saved = await menu.save();
//     res.status(202).send(saved);
//   } catch (err) {
//     console.log(err.message);
//   }
// });

//editing the foodpic
router.patch("/foodPic", async (req, res) => {
  try {
    const foodPic = req.files.foodPic;

    foodPic.mv("./pictures/foodPics/" + req.body.menu_id, function (err) {
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
//editing any thing else
router.patch("/:id", sellerAuth, async (req, res) => {
  try {
    let menu = await Menus.findByIdAndUpdate(req.params.id, req.body);

    let saved = await menu.save();
    res
      .status(202)
      .send(
        _.pick(saved, [
          "title",
          "ingredients",
          "category",
          "description",
          "type",
          "_id",
          "price",
          "kitchen",
        ])
      );
  } catch (err) {
    console.log(err.message);
  }
});

//deleting a menu
router.delete("/:id", async (req, res) => {
  try {
    await Menus.findByIdAndDelete(req.params.id);
    res.status(204).send("Deleted");
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
