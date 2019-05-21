var express = require('express');
var router = express.Router();


// 이미지 업로드
const upload = require('../../config/multer');

// MySQL Connection Pooling
var pool = require('../../config/dbConfig');

// 날짜 데이터들을 유연하게 변경
var moment = require('moment');

// 응답 코드, 응답 메시지
var resMessage = require('../../module/utils/responseMessage');
var statusCode = require('../../module/utils/statusCode');
var utils = require('../../module/utils/utils');


router.get('/', async(req, res) => {
    try {
        // 사용자로부터 데이터 받기
        let query;
        
        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 쿼리문 실행
        query = 'SELECT newsIdx, userName, title, thumbnail, saveTime FROM news ORDER BY saveTime DESC';
        data = await connection.query(query);
        console.log(data.length);
        console.log(data);
        for (let i = 0; i < data.length; i++) {
            data[i].saveTime = moment(data[i].saveTime).format('YYYY-MM-DD HH:mm:ss');
        }
        console.log(data);

        // 커밋
        await connection.commit();

        // 응답
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        console.log('데이터 조회 성공');
    } catch(err) {
        connection.rollback(() => {
            console.log(err);
        });
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});



router.post('/', upload.array('images'), async(req, res) => {
    try {
        // 사용자로부터 데이터 받기
        let images = req.files;
        let thumbnail;        
        let { userName, title, content } = req.body;
        let saveTime = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(saveTime);
        console.log(new Date());
        let image;
        let query;
        let results;
        console.log(req.body);

        // 이미지 파일이 2개 이상 존재할 때
        if (images.length >= 2) {
            thumbnail = images[0].location;
            // 데이터베이스 연결
            var connection = await pool.getConnection(); 
            await connection.beginTransaction(); // 트랜젝션 시작

            // 쿼리문 실행
            query = 'INSERT INTO news (userName, title, thumbnail, saveTime) VALUES (?, ?, ?, ?)'
            results = await connection.query(query, [userName, title, thumbnail, saveTime]);
            let news_FK = results.insertId;
            
            
            query = 'INSERT INTO newsInfo (content, news_FK, image) VALUES (?, ?, ?)';
            for (let i = 1; i < images.length; i++) {
                image = images[i].location;
                await connection.query(query, [content, news_FK, image]);
            }
            
            // 커밋
            await connection.commit();

            // 응답
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            console.log(resMessage.SAVE_SUCCESS);
        } else {
            // 이미지 파일이 2개이상 존재하지 않을 때
            res.status(200).json(utils.successTrue(statusCode.BAD_REQUEST, resMessage.INSUFFICIENT_IMAGES));
            console.log(resMessage.INSUFFICIENT_IMAGES);
        }
    } catch(err) {
        await connection.rollback();
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

router.get('/:idx', async(req, res) => {
    try {
        // 사용자로부터 데이터 받기
        let query;
        
        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 쿼리문 실행
        query = 'SELECT title, content, image, saveTime FROM news INNER JOIN newsInfo ON news.newsIdx = newsInfo.news_FK WHERE newsIdx = ?';
        data = await connection.query(query, req.params.idx);
        
        // 커밋
        await connection.commit();
        
        // 응답
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        console.log('데이터 조회 성공');
    } catch(err) {
        await connection.rollback();
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

module.exports = router;
