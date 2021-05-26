const mongoose = require("mongoose");
const date = require("date-and-time");

const getTime = (date) => {
  if (date == "") date = Date.now();

  const x = new Date();
  const hours = x.getUTCHours() >= 10 ? x.getUTCHours() : "0" + x.getUTCHours();
  const mins =
    x.getUTCMinutes() >= 10 ? x.getUTCMinutes() : "0" + x.getUTCMinutes();
  const seconds =
    x.getUTCSeconds() >= 10 ? x.getUTCMinutes() : "0" + x.getUTCSeconds();

  return `${hours}:${mins}`;
};

const schema = new mongoose.Schema({
  total: {
    type: Number,
  },
  kitchen: {
    type: mongoose.Types.ObjectId,
    ref: "Sellers",
  },
  tip: {
    type: Number,
  },
  deliveryNote: {
    type: String,
  },
  items: [
    {
      menu: {
        _id: { 
          type: mongoose.Types.ObjectId,
          ref: "Menus", //do not use to retreive orders as menus can be edited
        },
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
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    },
  ],
  orderNumber: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
  },
  stripeSessionId: {
    type: String,
    default: "",
  },
  status: {
    type: Number,
    default: 1,
    //1 = unpaid, 2 = paid, 3 = completed, 4 = refunded,
    //2.5 = ready for collection, 2.7 = out for delivery
  },
  orderRated: {
    //rate order icon will be availalable if false
    type: Boolean,
    default: false,
  },
  isDelivery: {
    //if false then its pickeup
    type: Boolean,
    default: false,
  },
  date: {
    type: String,
    default: new Date(Date.now()).toLocaleDateString(),
  },
  time: {
    type: String,
  },
  ETA: {
    date: {
      type: String,
    },
    time: {
      type: String,
    },
  },

  orderType: {
    //1 normal, 2 = catered
    type: Number,
    required: true,
    default: 1,
  },
});

schema.methods.getFastDeliveryETA = function (mins) {
  const now = new Date();
  let ETA = date.addMinutes(now, mins);

  return getTime(ETA);
};

schema.methods.getCurrentTime = function () {
  return getTime("");
};

module.exports.Orders = mongoose.model("Orders", schema);
