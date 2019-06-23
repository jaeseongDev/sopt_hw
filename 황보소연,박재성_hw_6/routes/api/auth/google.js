var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMessage = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
const passport = require('passport');


router.get('/',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] })
);

router.get('/callback', 
    passport.authenticate('google', { failureRedirect: '/api/webtoons/episodes' }),
    function(req, res) {
        res.send('성공!!!');
    });

module.exports = router;