const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;
require("dotenv/config");
const cryptr = new Cryptr(process.env.encryptrKey);

const schema = new mongoose.Schema({
  password: {
    type: String,
    minlength: 5,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    addressLine1: String,
    addressLine2: String,
    postcode: {
      type: String,
      minlength: 6,
      maxlength: 6,
    },
  },

  name: {
    type: String,
    required: true,
  },
  storeName: {
    type: String,
    required: true,
    unique: true,
  },
  storeNotes: [
    {
      note: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  ],
  city: {
    type: mongoose.Types.ObjectId,
    ref: "Cities",
    required: true,
  },
  contact: {
    type: String,
    required: true,
    maxlength: 11,
    minlength: 11,
  },
  stars: {
    type: Number,
    default: 0,
    max: 5,
    maxlength: 1,
  },
  ratingAverage: {
    numberOfStars: {
      type: Number,
      default: 0,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
  },

  origin: {
    type: mongoose.Types.ObjectId,
    ref: "Origins",
    required: true,
  },
  description: {
    type: String,
  },
  stripeId: {
    type: String,
    // required: true,
  },
  menu: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Menus",
    },
  ],
  isActive: {
    type: Boolean,
    default: false,
  },
  offersDelivery: {
    type: Boolean,
    default: false,
  },
});

schema.methods.generateJwtToken = function () {
  const token = jwt.sign(
    {
      seller: {
        _id: this.id,
        address: this.address,
        storeName: this.storeName,
        isActive: this.isActive,
        menu: this.menu,
        description: this.description,
        stars: this.stars,
        ratingAverage: this.ratingAverage,
        origin: this.origin,
        city: this.city,
        name: this.name,
      },
    },
    process.env.jwtKey
  );
  return token;
};

schema.methods.hashPassword = async function () {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(this.password, salt);

  return password;
};

schema.methods.encryptBankDetials = async function () {
  const accountNumber = cryptr.encrypt(this.bank.accountNumber);
  const sortCode = cryptr.encrypt(this.bank.sortCode);

  const bank = {
    accountNumber: accountNumber,
    sortCode: sortCode,
    accountHolderName: this.bank.accountHolderName,
    bankName: this.bank.bankName,
  };
  return bank;
};

schema.methods.decryptBankDetials = function () {
  const accountNumber = cryptr.decrypt(this.bank.accountNumber);
  const sortCode = cryptr.decrypt(this.bank.sortCode);
  const bank = {
    accountNumber: accountNumber,
    sortCode: sortCode,
    accountHolderName: this.bank.accountHolderName,
    bankName: this.bank.bankName,
  };
  return bank;
};

module.exports.Sellers = mongoose.model("Sellers", schema);
