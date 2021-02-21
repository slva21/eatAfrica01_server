const mongoose = require('mongoose')


const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true
    }
})

module.exports.Origins = mongoose.model('Origins', schema)