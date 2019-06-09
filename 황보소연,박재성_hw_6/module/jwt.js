const jwt = require('jsonwebtoken');
const options = {
    algorithm: "HS256",
    expiresIn: "14d",
    issuer: "jaeseong"
};
const secretOrPrivateKey = require('../config/jwtConfig');
var utils = require('./utils/utils');
var resMessage = require('./utils/responseMessage');
var statusCode = require('./utils/statusCode');
var jwtmodule= require('../module/jwt')


exports.signToken = (userId, userIdx) => {
    const payload = {
        userId,
        userIdx
    }
    const token = jwt.sign(payload, secretOrPrivateKey, options);
    return token;
};


exports.verifyToken = (req, res, next) => {
    try {
        req.decoded = jwt.verify(req.headers.authorization, secretOrPrivateKey);
        return next(); // 다음 미들웨어로 넘어감.
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.EXPIRED_TOKEN));
        }
        return res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.INVALID_TOKEN));
    }
};

exports.verifyTokenNotLoggedIn = (req, res, next) => {
    var token = req.headers.authorization;
    if (!token) {
        return next();
    } else {
        jwtmodule.verifyToken(req, res, next);
    }
}