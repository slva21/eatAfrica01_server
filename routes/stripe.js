const express = require("express");
const { round } = require("lodash");
const router = express.Router();

const { Sellers } = require("../models/sellers");
const { Users } = require("../models/users");

const stripe = require("stripe")(
  "sk_test_51HQJy6BM729ohvyiwM2urlGwhJ3qrtBoWpwPytnxQCqFCbxhGo03Efrm8xUcN2spYM1qaOa9uWch74W1ne3CElc300B7UjCrtR"
);

router.get("/accountlink/:sellerId", async (req, res) => {
  try {
    const seller = await Sellers.findById(req.params.sellerId);

    const accountLinks = await stripe.accountLinks.create({
      account: seller.stripeId,
      refresh_url: "http://192.168.0.47:3000/mykitchen/edit",
      return_url: "http://192.168.0.47:3000/mykitchen/edit",
      type: "account_onboarding",
    });

    res.status(200).send(accountLinks);
  } catch (err) {
    console.log(err);
  }
});

router.get("/loginLink/:sellerId", async (req, res) => {
  try {
    const seller = await Sellers.findById(req.params.sellerId);

    const loginLink = await stripe.accounts.createLoginLink(seller.stripeId);
    res.status(200).send(loginLink);
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/createaccount", async (req, res) => {
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

    res.status(200).send(account);
  } catch (err) {
    console.log(err);
  }
});

router.post("/createCharge", async (req, res) => {
  try {
    const seller = await Sellers.findById(req.body.sellerId);
    console.log(seller);

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ["card"],
      amount: 1000,
      currency: "gbp",
      application_fee_amount: 123,
      payment_method: req.body.id,
      transfer_data: {
        destination: seller.stripeId,
      },
      confirm: true,
    });

    res.status(200).send(paymentIntent);
  } catch (err) {
    console.log(err.message);
  }
});

router.post("/createSession", async (req, res) => {
  try {
    const seller = await Sellers.findById(req.body.sellerId);
    const user = await Users.findById(req.body.userId);

    const total = round(user.cart.total * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          name: "Eat Africa",
          amount: total,
          currency: "gbp",
          price_data: {},
          quantity: 1,
        },
      ],

      customer_email: user.email,
      allow_promotion_codes: true,
      payment_intent_data: {
        application_fee_amount: round(total * 0.2),
        // on_behalf_of: '{{CONNECTED_STRIPE_ACCOUNT_ID}}',
        transfer_data: {
          destination: seller.stripeId,
        },
      },
      success_url: `http://192.168.0.47:3000/complete/${req.body.orderId}`,
      cancel_url: "http://192.168.0.47:3000/cart",
    });

    res.status(200).send(session);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
