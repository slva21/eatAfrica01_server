const express = require("express");
const { Users } = require("../models/users");
const { Menus } = require("../models/menus");

const _ = require("lodash");

const router = express.Router();

//adding menu && adding/removing options
router.patch("/", async (req, res) => {
  try {
    let user = await Users.findById(req.body.userId);

    const menu = await Menus.findById(req.body.menuId);

    // figure out if the menu has allready been added the the cart. if yes, there is no need to add it again

    //finding the current carts kitchen

    // if (!user.cart.kitchen || user.cart.kitchen === "")
    user.cart.kitchen = menu.kitchen;

    const isMenu = user.cart.items.find(
      ({ menu }) => menu._id.toString() === req.body.menuId
    ); //this need to be declared before the menu itself is added to the array if it is not there.

    if (!isMenu) {
      user.cart.items.push({
        menu: {
          _id: req.body.menuId,
          options: [],
          quantity: 1,
          __v: req.body.menu__v,
        },
      });
      user.cart.total = user.cart.total + menu.price;
    }

    //..................................
    //if an optionId is sent in the request, find the appropiate menu object and add it to its options array
    if (req.body.optionId) {
      const option = menu.options.find(
        ({ _id }) => _id.toString() === req.body.optionId
      );
      const isOption = isMenu.menu.options.find(
        (m) => m.toString() === req.body.optionId
      );

      //adding the current options to the users cart
      isMenu.menu.options.push(req.body.optionId);
      // if the option allready exists in the array, remove it and subtract its price from the total

      if (isOption) {
        let updatedOptions = isMenu.menu.options.filter(
          (m) => m.toString() !== req.body.optionId
        );
        isMenu.menu.options = updatedOptions;
        user.cart.total = user.cart.total - option.price * isMenu.menu.quantity;
      } else {
        user.cart.total = user.cart.total + option.price * isMenu.menu.quantity;
      }
    }

    user = await user.save();
    res.status(200).json(_.pick(user, ["cart"]));
  } catch (err) {
    console.log(err);
  }
});

router.patch("/tip", async (req, res) => {
  try {
    let user = await Users.findById(req.body._id, "cart");

    if (req.body.tip == 0) {
      user.cart.total = user.cart.total / user.cart.tip;
      user.cart.tip = 1;
      const saved = await user.save();

      res.status(201).json(saved.cart.total);
      return;
    }

    //reset the amount to the 0% amount first
    user.cart.total = user.cart.total / user.cart.tip;
    //cart has been reset

    user.cart.tip = req.body.tip;
    user.cart.total = user.cart.total * req.body.tip;

    const saved = await user.save();
    res.status(201).json(saved.cart.total);
  } catch (err) {
    console.log(err.message);
  }
});

router.patch("/quantity", async (req, res) => {
  try {
    const menuId = req.body.menuId;
    const operator = req.body.operator;

    let user = await Users.findById(req.body.userId);
    const currentMenu = await Menus.findById(menuId, "-foodPic");

    if (!currentMenu) {
      return res.status(400).send("Item must be added to cart first");
    }

    let { menu } = user.cart.items.find(
      ({ menu }) => menu._id.toString() === menuId
    );

    if (operator === "+") {
      menu.quantity++;
      user.cart.total = user.cart.total + currentMenu.price;

      if (menu.options) {
        menu.options.forEach((_id) => {
          let option = currentMenu.options.find(
            (m) => m._id.toString() === _id.toString()
          );
          user.cart.total = user.cart.total + option.price;
        });
      }
    }

    if (operator === "-") {
      menu.quantity--;
      user.cart.total = user.cart.total - currentMenu.price;

      if (menu.options) {
        menu.options.forEach((_id) => {
          let option = currentMenu.options.find(
            (m) => m._id.toString() === _id.toString()
          );
          user.cart.total = user.cart.total - option.price;
        });
      }
    }

    if (user.cart.total < 0) {
      return res.status(400).send("cart cannot be less than £0.00");
    }

    const { cart } = await user.save();

    res.status(200).send(cart.items);
  } catch (err) {
    console.log(err);
  }
});

router.patch("/setCart", async (req, res) => {
  try {
    let user = await Users.findById(req.body.userId, "cart");

    user.cart = req.body.cart;
    res.status(202).json("Cart updated");

    await user.save();
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    let cart = await Users.findById(req.params.id);

    if (!cart) {
      res.status(404).send("Empty cart");
    }

    res.status(200).send(_.pick(cart, ["cart"]));
  } catch (err) {
    console.log(err);
  }
});

router.get("/populate/:id", async (req, res) => {
  try {
    let user = await Users.findById(req.params.id)
      .populate("cart.items.menu._id", ["title", "options", "price", "__v"])
      .populate("cart.kitchen", ["contact", "storeNotes", "storeName"]);
    if (!user) {
      res.status(404).send("User not found");
    }

    //manually populate the current options
    user.cart.items.forEach(({ menu }) => {
      menu.populatedOptions = [];
      menu.options.forEach((id) => {
        //normal
        const populated = menu._id.options.find(
          //popu
          ({ _id }) => _id.toString() === id.toString()
        );
        if (populated != null) {
          menu.populatedOptions.push(populated);
        }
      });
    });

    res.status(200).send(_.pick(user, ["cart"]));
  } catch (err) {
    console.log(err);
  }
});

router.delete("/:userId/:menuId", async (req, res) => {
  try {
    let user = await Users.findById(req.params.userId, [
      "cart",
    ]).populate("cart.items.menu._id", ["title", "options", "price"]);

    //find the menu object in the cart
    let { menu } = user.cart.items.find(
      ({ menu }) => menu._id._id.toString() === req.params.menuId.toString()
    );

    //expection
    if (!menu) return res.status(404).send("Menu already Deleted");

    //subtracts its cost from the total
    user.cart.total = user.cart.total - menu._id.price * menu.quantity;

    //subtract its options cost from the total
    menu.options.forEach((id) => {
      let option = menu._id.options.find(
        ({ _id }) => _id.toString() === id.toString()
      );
      user.cart.total = user.cart.total - option.price * menu.quantity;
    });

    //remove the menu object from the array
    user.cart.items = user.cart.items.filter(
      ({ menu }) => menu._id._id.toString() !== req.params.menuId.toString()
    );

    //recall the populate route on the server

    await user.save();
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
