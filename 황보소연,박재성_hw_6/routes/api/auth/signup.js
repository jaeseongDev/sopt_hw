var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMsg = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
var pool = require('../../../config/dbConfig');
var cryptoPassword = require('../../../module/cryptoPassword');

//회원가입, id 중복 회원가입 불가
router.post('/', async(req, res) => {
    let { userId, userPw, userName } = req.body;
    let salt = await cryptoPassword.salt();

    userPw = await cryptoPassword.hashedPassword(userPw, salt);

    const insertUserInfoQuery = 'INSERT INTO user(userPw, userName, userId, salt) VALUES(?,?,?,?)';
    //행을 하나이상 반환하면 true
    const selectCheckSameId = 'SELECT EXISTS (SELECT * FROM user WHERE userId = ?) as success';

    await pool.getConnection((err, connection) => {
        if(err){
            console.log('connection err: ' + err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMsg.INTERNAL_SERVER_ERROR));
        } else{
            connection.query(selectCheckSameId, [userId], (err, result) => {
                if(err){
                    console.log('connection err:' + err);
                    res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMsg.INTERNAL_SERVER_ERROR));
                }
                // Params나 Body값에 Null이 존재하는 경우
                if (!userId || !userPw || !userName) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMsg.WRONG_PARAMS));

                // 이미 존재하는 아이디가 있을 경우    
                } else if(result[0].success == true){
                    res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMsg.ALREADY_USER));
                // 이미 존재하는 아이디가 없을 경우
                } else if(result[0].success == false){
                    connection.query(insertUserInfoQuery, [userPw, userName, userId, salt], (err, result) => {
                        if (err) {
                            console.log(err);
                            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                        }
                        res.status(200).send(utils.successTrue(statusCode.OK, resMsg.SIGNUP_SUCCESS));
                })
            }
        });
    }});

});
module.exports = router;