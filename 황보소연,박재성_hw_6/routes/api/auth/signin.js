var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMessage = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
var jwt = require('../../../module/jwt');
const passport = require('passport');


router.post('/', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        // 예상치 못한 에러 발생
        if (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        // 로그인 실패
        } else if (!user) {
            res.status(200).json(info);
        // 로그인 성공
        } else {
            const token = jwt.signToken(user.userId, user.userIdx);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, { token: token }));
        }
    })(req, res, next);
});

module.exports = router;