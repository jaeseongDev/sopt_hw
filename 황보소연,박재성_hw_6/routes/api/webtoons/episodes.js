var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const upload = require('../../../config/multer');
var jwt = require('../../../module/jwt');

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
            let query = 'SELECT webtoonsIdx FROM webtoons WHERE webtoonsIdx = ?';
            let result = await connection.query(query, [webtoonsIdx]);
            if (!result[0]) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
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
        }
    } catch(err) {
        connection.rollback();
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});


router.get('/', jwt.verifyTokenNotLoggedIn, async(req, res) => {
    try {
        const { webtoonsIdx } = req.query;
        var connection = await pool.getConnection();        
        if (!webtoonsIdx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let query1 = 'SELECT title FROM webtoons WHERE webtoonsIdx = ?';
            let result1 = await connection.query(query1, [webtoonsIdx]);
            if (!result1[0]) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                let query2 = 'SELECT contents.contentsIdx, contents.thumbnail, contents.title, '
                        + 'DATE_FORMAT(contents.writeTime, "%y.%m.%d") as writeTime, '
                        + 'COUNT(visiting.contentsIdx) as visitings '
                        + 'FROM contents LEFT OUTER JOIN visiting '
                        + 'ON contents.contentsIdx = visiting.contentsIdx '
                        + 'GROUP BY contents.contentsIdx '
                        + 'ORDER BY contents.writeTime DESC';
                let result2 = await connection.query(query2);
                if (!req.decoded) {
                    var isLike = "NotLoggedIn"
                } else {
                    const { userIdx } = req.decoded;
                    let query3 = 'SELECT likesIdx FROM likes WHERE userIdx = ? AND webtoonsIdx = ?';
                    let result3 = await connection.query(query3, [userIdx, webtoonsIdx]); 
                    if (!result3[0]) {
                        var isLike = false;
                    } else {
                        var isLike = true;
                    };
                };
                let data = {
                    webtoon_title: result1[0].title,
                    isLike: isLike,
                    episodes: result2
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

router.delete('/', async(req, res) => {
    try {
        const { contentsIdx } = req.body;

        var connection = await pool.getConnection();

        // Params나 Body값 Null이 존재하는 경우
        if (!contentsIdx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let query = 'DELETE FROM contents WHERE contentsIdx = ?';
            let result = await connection.query(query, [contentsIdx]);
            // Params에 잘못된 값이 입력된 경우
            if (result.affectedRows == 0) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
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