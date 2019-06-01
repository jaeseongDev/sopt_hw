var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMessage = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
var pool = require('../../../config/dbConfig');


//로그인 정보 확인
router.post('/', async(req, res) => {
    try {

        const { userId, userPw } = req.body;
        var connection = await pool.getConnection();
        // Params나 Body값 Null이 존재하는 경우
        if (!userId || !userPw) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        // 아이디가 없는 경우
        let query = 'SELECT userId, userPw FROM user WHERE userId = ?';
        const result = await connection.query(query, [userId]);
        console.log(result);
        if (!result[0]) {
            res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));
        // 아이디는 있는데 비밀번호가 틀린 경우
        } else if (userPw != result[0].userPw) {
            res.status(200).json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));
        // 로그인 성공
        } else {
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS));
        }
    } catch(err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

module.exports = router;