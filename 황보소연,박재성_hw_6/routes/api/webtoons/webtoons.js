var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const upload = require('../../../config/multer');

router.post('/', upload.array('thumbnail'), async(req, res) => {
    try {
        const files = req.files;
        const { title, writer, isFinished } = req.body;

        var connection = await pool.getConnection();

        // Params나 Body값 Null이 존재하는 경우
        if (!files[0] || !title || !writer || !isFinished) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        // Params에 잘못된 값이 입력된 경우
        } else if (isFinished !== '1' && isFinished !== '2') {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        // 사진이 2장 이상 첨부된 경우
        } else if (files.length > 1) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.TOO_MANY_FILES));
        } else {
            const thumbnail = files[0].location;
            let query = 'INSERT INTO webtoons (thumbnail, title, writer, isFinished) VALUES (?, ?, ?, ?)';
            await connection.query(query, [thumbnail, title, writer, isFinished]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        }
    } catch(err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

module.exports = router;