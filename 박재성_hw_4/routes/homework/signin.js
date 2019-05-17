var express = require('express');

var cryptoPassword = require('../../module/board/cryptoPassword');
var utils = require('../../module/utils/utils');
var statusCode = require('../../module/utils/statusCode');
var resMessage = require('../../module/utils/responseMessage');

var router = express.Router();

// MySQL 데이터베이스 Pooling
const pool = require('../../config/dbConfig');

router.post('/', async(req, res) => {
    try {
        // 사용자로부터 id(아이디), password(비밀번호) 받기
        let { id, password } = req.body;
        
        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // DB에서 해당 id를 가진 로우의 salt 값으로 해싱한 뒤 비밀번호 일치 여부 판단
        let userFindQuery = 'SELECT * FROM user WHERE ID = ?';
        let results = await connection.query(userFindQuery, [id]);
        if (results[0]) {
            let salt = results[0].salt;
            let inputPassword = await cryptoPassword.hashedPassword(password, salt);
            if (inputPassword == results[0].password) {
                res.status(200).send(utils(statusCode.OK, resMessage.LOGIN_SUCCESS));
            } else {
                res.status(200).send(utils(statusCode.OK, resMessage.LOGIN_FAIL));    
            }
        } else {
            res.status(200).send(utils(statusCode.OK, resMessage.LOGIN_FAIL));
        }
    } catch (err) {
        connection.rollback(() => {
            console.log(err);
        });
        res.status(200).send(utils(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});
module.exports = router;