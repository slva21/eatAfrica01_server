const jwt = require('jsonwebtoken');
require('dotenv/config');

function sellerAuth(req, res, next) {
    const token = req.header('x-seller-token');
    if (!token) return res.status(401).send('Access denied, sellers token not provided');

    try {
        const decoded = jwt.verify(token, process.env.jwtKey)
        req.seller = decoded
        next();

    } catch (err) {
        res.status(400).send('Invalid token');
        console.log(err.message)
    }

}

module.exports = sellerAuth;