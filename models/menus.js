const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectID;

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  ingredients: {
    type: [String],
    required: true,
  },
  type: {
    //reqular or catered
    type: String,
    required: true,
  },
  category: {
    //mains drinks snacks
    type: String,
    required: true,
  },
  options: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      _id: {
        type: String,
        default: new ObjectId(),
      },
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  kitchen: {
    type: mongoose.Types.ObjectId,
    ref: "Sellers",
    require: true,
  },
});

module.exports.Menus = mongoose.model("Menus", schema);
