var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMessage = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
var pool = require('../../../config/dbConfig');
var cryptoPassword = require('../../../module/cryptoPassword');
var jwt = require('../../../module/jwt');


//로그인 정보 확인
router.post('/', async(req, res) => {
    try {
        let { userId, userPw } = req.body;
        var connection = await pool.getConnection();
        // Params나 Body값 Null이 존재하는 경우
        if (!userId || !userPw) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            // 아이디가 없는 경우
            let query = 'SELECT * FROM user WHERE userId = ?';
            const result = await connection.query(query, [userId]);
            let userIdx = result[0].userIdx;
            if (!result[0]) {
                res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));
            } else {
                let salt = result[0].salt;
                userPw = await cryptoPassword.hashedPassword(userPw, salt); 
                const token = jwt.signToken(userId, userIdx);
                // 아이디는 있는데 비밀번호가 틀린 경우
                if (userPw != result[0].userPw) {
                    res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));
                // 로그인 성공
                } else if (userPw == result[0].userPw) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, { token: token }));
                }
            }
        }
    } catch(err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

module.exports = router;