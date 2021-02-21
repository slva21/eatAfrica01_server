const express = require("express");
const {
    Origins
} = require("../models/origins");
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        let newOrigin = new Origins({
            name: req.body.name,
            path: req.body.path

        })
        newOrigin = await newOrigin.save()
        res.status(201).send(newOrigin)
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/', async (req, res) => {
    try {
        const origins = await Origins.find()
        res.status(200).send(origins)
    } catch (err) {
        res.send(err.message)
    }
})
module.exports = router;