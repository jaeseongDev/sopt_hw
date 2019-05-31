var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');

router.post('/', async(req, res) => {
    try {
        const { userIdx, webtoonsIdx } = req.body;

        var connection = await pool.getConnection();

        let query1 = 'SELECT EXISTS (SELECT * FROM user WHERE useridx = ?) as isExist';
        let query2 = 'SELECT EXISTS (SELECT * FROM webtoons WHERE webtoonsIdx = ?) as isExist';
        let result1 = await connection.query(query1, [userIdx]);
        let result2 = await connection.query(query2, [webtoonsIdx]);

        // Params나 Body값 Null이 존재하는 경우
        if (!userIdx || !webtoonsIdx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        // Params에 잘못된 값이 입력된 경우
        } else if (result1[0].isExist == false || result2[0].isExist == false) {   
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        } else {
            let query = 'SELECT EXISTS (SELECT * FROM likes WHERE userIdx = ? AND webtoonsIdx = ?) as isExist';
            let result = await connection.query(query, [userIdx, webtoonsIdx]);
            if (result[0].isExist == false) {
                let query2 = 'INSERT INTO likes (userIdx, webtoonsIdx) VALUES (?, ?)';
                let result2 = await connection.query(query2, [userIdx, webtoonsIdx]);
                res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_LIKES, result2));
            } else {
                let query3 = 'DELETE FROM likes WHERE userIdx = ? AND webtoonsIdx = ?';
                let result3 = await connection.query(query3, [userIdx, webtoonsIdx]);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_LIKES, result3));
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