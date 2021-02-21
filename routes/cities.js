const express = require("express");
const {
    Cities
} = require("../models/cities");
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        let newCity = new Cities({
            name: req.body.name
        })
        newCity = await newCity.save()
        res.status(201).send(newCity)
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/', async (req, res) => {
    try {
        const cities = await Cities.find()
        res.status(200).send(cities)
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/:id', async (req, res) => {
    try {
        const city = await Cities.findById(req.params.id)
        res.status(200).send(city)
    } catch (err) {
        res.send(err.message)
    }
})


module.exports = router;