var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const upload = require('../../../config/multer');

router.get('/', async(req, res) => {
    try {
        var connection = await pool.getConnection();        
        if (!req.query.contentsIdx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let query1 = 'SELECT * FROM webtoons WHERE webtoonsIdx = (SELECT webtoonsIdx FROM contents WHERE contentsIdx = ?)';
            let result1 = await connection.query(query1, [req.query.contentsIdx]);
            if (!result1[0]) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                let query2 = 'SELECT * FROM contentsImg WHERE contentsIdx = ?';
                let result2 = await connection.query(query2, [req.query.contentsIdx]);;
                let data = {
                    webtoon_title: result1[0].title,
                    episode_images: result2
                };
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        }
    } catch(err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})

module.exports = router;