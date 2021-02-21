const express = require("express");
const bcrypt = require('bcrypt');
const {
    Sellers
} = require("../models/sellers");
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        let seller = await Sellers.findOne({
            email: req.body.email
        }, {
            'banner': 0
        })

        if (!seller) return res.status(400).send('Invalid email')

        const isValid = await bcrypt.compare(req.body.password, seller.password)

        if (!isValid) return res.status(400).send('Invalid password')

        const token = seller.generateJwtToken();


        res.status(200).send(token)


    } catch (err) {
        console.log(err.message)

    }
})

module.exports = router;