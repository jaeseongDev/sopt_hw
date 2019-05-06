const express = require('express');
const fs = require('fs');
const csv = require('csvtojson');

// 응답 코드, 응답 메시지
const utils = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

// 비밀번호 암호화
const cryptoPassword = require('../../module/board/cryptoPassword');

// 데이터를 csv로 저장 
const saveToCsv = require('../../module/board/saveToCsv');

const router = express.Router();


router.post('/', async (req, res) => {
    try { 
        const { title, content, password } = req.body;
        
        // password 암호화
        const salt = await cryptoPassword.salt();
        const hashedPassword = await cryptoPassword.hashedPassword(password, salt);
        
        let data = [{
            id: Math.random().toString(36).substr(2, 16),
            title,
            content,
            date: new Date(),
            hashedPassword,
            salt
        }];

        if (fs.existsSync('./board_data.csv')) {
            const jsonArray = await csv().fromFile('./board_data.csv');
            data = [...jsonArray, ...data]

            // 저장 시 같은 제목의 글이 있을 경우 실패 메시지를 반환
            for (let i = 0; i < jsonArray.length; i++) {
                if (jsonArray[i].title === title) {
                    res.status(409).json(utils(statusCode.CONFLICT, resMessage.EXISTING_TITLE));
                    throw new Error("같은 제목의 글이 이미 존재");
                }
            }
        } 
                
        // 게시물의 정보를 csv로 저장        
        saveToCsv(data);
        res.status(201).json(utils(statusCode.CREATED, resMessage.CREATED_POST));
    } catch (err) {
        console.log(err);
    }
});


router.put('/', async (req, res) => {
    try {
        const { id, title, content, password } = req.body;        
        const jsonArray = await csv().fromFile('./board_data.csv');

        for (let i = 0; i < jsonArray.length; i++) {
            // 저장 시 같은 제목의 글이 있을 경우 실패 메시지를 반환
            if (jsonArray[i].title === title && jsonArray[i].id !== id) {
                res.status(409).json(utils(statusCode.CONFLICT, resMessage.EXISTING_TITLE));
                throw new Error("같은 제목의 글이 이미 존재합니다.");
            }
            
            // 게시물의 정보를 수정
            if (jsonArray[i].id === id) {
                const { salt } = jsonArray[i];
                const hashedPassword = await cryptoPassword.hashedPassword(password, salt);

                // 비밀번호가 맞지 않을 경우 수정 권한 없다고 실패 메시지를 반환
                if (jsonArray[i].hashedPassword !== hashedPassword) {
                    res.status(401).json(utils(statusCode.UNAUTHORIZED, resMessage.WRONG_PASSWORD));
                    throw new Error("비밀번호가 맞지 않습니다.");
                }

                jsonArray[i].title = title;
                jsonArray[i].content = content;
                jsonArray[i].date = new Date();
                
                // 게시물의 정보를 csv로 저장
                saveToCsv(jsonArray);
                console.log("데이터를 csv에 성공적으로 수정해서 저장했습니다.");
                res.status(201).json(utils(statusCode.CREATED, resMessage.UPDATE_POST));

                break;
            }
        }
    } catch (err) {
        console.log(err);
    }
});

router.delete('/', async (req, res) => {
    try {
        jsonArray = await csv().fromFile('./board_data.csv');
        const { id, password } = req.body;
        for (let i = 0; i < jsonArray.length; i++) {
            if (jsonArray[i].id === id) {
                    // 비밀번호가 맞지 않을 경우 수정 권한 없다고 실패 메시지를 반환
                    const { salt } = jsonArray[i];
                    const hashedPassword = await cryptoPassword.hashedPassword(password, salt);
                    if (jsonArray[i].hashedPassword !== hashedPassword) {
                        res.status(401).json(utils(statusCode.UNAUTHORIZED, resMessage.WRONG_PASSWORD));
                        throw new Error("비밀번호가 맞지 않습니다.");
                    }
                jsonArray.splice(i, 1);
            }
        }

        saveToCsv(jsonArray);
        console.log("데이터를 삭제한 후 성공적으로 csv로 저장했습니다.");
        res.status(204).json(utils(statusCode.NO_CONTENT, resMessage.DELETED_POST));
            
    } catch (err) {
        console.log(err);
    }
});

router.get('/:id', async (req, res) => {
    try {
        jsonArray = await csv().fromFile('./board_data.csv');
        for (let i = 0; i < jsonArray.length; i++) {
            if (jsonArray[i].id === req.params.id) {
                console.log(jsonArray[i]);
            }
        }
        res.status(200).json(utils(statusCode.OK, resMessage.READ_POST));
    } catch (err) {
        console.log(err);
        res.status(500).json(utils(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
});

module.exports = router;