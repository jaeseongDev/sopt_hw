var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const upload = require('../../../config/multer');

router.post('/', upload.fields([{ name: 'thumbnail' }, { name: 'images'}]), async(req, res) => {
    try {
        const files = req.files;
        const { webtoonsIdx, title } = req.body;

        var connection = await pool.getConnection();
        await connection.beginTransaction();

        // Params나 Body값 Null이 존재하는 경우
        if (!files['thumbnail'] || !files['images'] || !webtoonsIdx || !title) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        // 사진이 2장 이상 첨부된 경우
        } else if (files['thumbnail'].length > 1) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.TOO_MANY_FILES));
        } else {
            const thumbnail = files['thumbnail'][0].location;
            let query = 'INSERT INTO contents (thumbnail, title, webtoonsIdx) VALUES (?, ?, ?)';
            let result = await connection.query(query, [thumbnail, title, webtoonsIdx]);
            const contentsIdx = result.insertId;

            for (let i = 0; i < req.files['images'].length; i++) {
                let image = req.files['images'][i].location;
                let query = 'INSERT INTO contentsImg (image, contentsIdx) VALUES (?, ?)';
                await connection.query(query, [image, contentsIdx])
            };

            await connection.commit();

            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        }
    } catch(err) {
        connection.rollback();
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

module.exports = router;