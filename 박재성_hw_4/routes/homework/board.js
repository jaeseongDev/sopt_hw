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
        // 게시물 정보 받기
        let { title, content, boardPw, writer } = req.body;
        
        // 패스워드 암호화 하기
        let salt = await cryptoPassword.salt();
        boardPw = await cryptoPassword.hashedPassword(boardPw, salt);

        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 게시물 저장
        let userInsertQuery = 'INSERT INTO board (writer, title, content, writetime, boardPw, salt) VALUES (?, ?, ?, ?, ?, ?)';
        let writetime = new Date();
        userValue = [writer, title, content, writetime, boardPw, salt];
        await connection.query(userInsertQuery, userValue);
        await connection.commit();
        res.status(200).send(utils(statusCode.CREATED, resMessage.CREATED_POST));        
    } catch (err) {
        connection.rollback(() => {
            console.log(err);
        });
        res.status(200).send(utils(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

router.get('/', async(req, res) => {
    try {
        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 저장된 전체 게시물 불러오기
        let readAllBoard = 'SELECT * FROM board';
        let results = await connection.query(readAllBoard);
        console.log(results);
        await connection.commit();
        res.status(200).send(utils(statusCode.OK, resMessage.READ_POST));        
    } catch (err) {
        connection.rollback(() => {
            console.log(err);
        });
        res.status(200).send(utils(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
});

router.delete('/', async(req, res) => {
    try {
        const { boardIdx, boardPw } = req.body;

        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 게시물의 비밀번호와 입력받은 비밀번호가 일치하는 지 확인
        let boardFindQuery = 'SELECT * FROM board WHERE boardIdx = ?';
        let results = await connection.query(boardFindQuery, [boardIdx]);
        if (results[0]) {
            let salt = results[0].salt;
            let inputBoardPw = await cryptoPassword.hashedPassword(boardPw, salt);
            if (inputBoardPw == results[0].boardPw) {
                // 게시물 삭제
                let deleteBoard = 'DELETE FROM board WHERE boardIdx = ?';
                await connection.query(deleteBoard, [boardIdx]);
                await connection.commit();
                res.status(200).send(utils(statusCode.OK, resMessage.DELETED_POST)); 
            } else {
                res.status(200).send(utils(statusCode.OK, resMessage.WRONG_PASSWORD));    
            }
        } else {
            res.status(200).send(utils(statusCode.NOT_FOUND, resMessage.NOT_EXISTING_ID));
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

router.get('/:idx', async(req, res) => {
    try {
        const { idx } = req.params;

        // 데이터베이스 연결
        var connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜젝션 시작

        // 저장된 특정 게시물 불러오기
        let readBoard = 'SELECT * FROM board WHERE boardIdx = ?';
        let results = await connection.query(readBoard, [idx]);
        console.log(results);
        await connection.commit();
        res.status(200).send(utils(statusCode.OK, resMessage.READ_POST));        
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

