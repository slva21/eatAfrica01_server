const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { min } = require("lodash");
require("dotenv/config");

const schema = new mongoose.Schema({
  password: {
    type: String,
    minlength: 5,
    required: true,
  },
  phone: {
    type: Number,
    maxlength: 11,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },

  coupons: [
    {
      type: String,
    },
  ],

  cart: {
    total: {
      type: Number,
      default: 0,
    },
    kitchen: {
      type: mongoose.Types.ObjectId,
      ref: "Sellers",
    },
    tip: {
      type: Number,
      default: 1,
    },
    note: {
      type: String,
    },
    items: [
      {
        menu: {
          _id: {
            type: mongoose.Types.ObjectId,
            ref: "Menus",
          },

          options: [
            {
              type: String,
            },
          ],
          __v: {
            type: Number,
          },
          populatedOptions: [
            {
              _id: String,
              name: String,
              price: Number,
            },
          ],
          quantity: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      },
    ],
  },
  orders: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Orders",
    },
  ],
  address: [
    {
      //user can save multiple addresses
      postcode: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: mongoose.Types.ObjectId,
        ref: "Cities",
        required: true,
      },
      nearKitchens: [
        //kitchen already found to be near to this address
        {
          type: mongoose.Types.ObjectId,
          ref: "Sellers",
        },
      ],
    },
  ],
});

schema.methods.generateJwtToken = function () {
  const token = jwt.sign(
    {
      userInfo: {
        _id: this.id,
        isAdmin: this.isAdmin,
        name: this.name,
        phone: this.phone,
        address: this.address,
      },
      cart: this.cart,
    },
    process.env.jwtKey
  );
  return token;
};

module.exports.Users = mongoose.model("Users", schema);
