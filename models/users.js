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
  // contact: {
  //   type: Number,
  //   maxlength: 11,
  //   required: true,
  // },
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
      },
      addressLine1: {
        type: String,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
      },
      town: {
        type: String,
      },
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
      },
      cart: this.cart,
    },
    process.env.jwtKey
  );
  return token;
};

module.exports.Users = mongoose.model("Users", schema);
