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
        // 사용자로부터 id(아이디), name(이름), password(비밀번호) 받기
        let { id, name, password } = req.body;
        
        // 패스워드 암호화 하기
        let salt = await cryptoPassword.salt();
        password = await cryptoPassword.hashedPassword(password, salt);

        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 저장 시 같은 아이디가 있는지 확인하기
        let userExistCheckQuery = 'SELECT EXISTS (SELECT * FROM user WHERE ID = ?) as success';
        let results = await connection.query(userExistCheckQuery, [id]);
        let isExistingId = results[0].success;

        // 저장 시 같은 아이디가 없을 경우 데이터베이스에 userIdx, id, name, password, salt 저장하기
        if (isExistingId == false) {
            let userInsertQuery = 'INSERT INTO user (id, name, password, salt) VALUES (?, ?, ?, ?)';
            userValue = [id, name, password, salt];
            await connection.query(userInsertQuery, userValue);
            await connection.commit();
            res.status(200).send(utils(statusCode.CREATED, resMessage.CREATED_USER));        
        } else {
        // 같은 아이디가 있을 경우에 실패메시지 반환하기
            res.status(200).send(utils(statusCode.CONFLICT, resMessage.EXISTING_ID));
            console.log('같은 아이디 존재');
        }
    } catch (err) {
        connection.rollback(() => {
            console.log(err);
        });
    } 
    finally {
        connection.release();
    }
});
module.exports = router;