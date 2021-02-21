const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    img: {
        name: String,
        data: Buffer,
    },

});

module.exports.pictures = mongoose.model("pictures", schema);