var express = require('express');
var router = express.Router();
var express = require('express');
var router = express.Router();
var utils = require('../../../module/utils/utils');
var resMessage = require('../../../module/utils/responseMessage');
var statusCode = require('../../../module/utils/statusCode');
var pool = require('../../../config/dbConfig');
var upload = require('../../../config/multer');

//댓글 작성하기
router.post('/', upload.array('image'), async(req, res) => {
    try{
        const { content, contentsIdx, userIdx} = req.body;
        const files = req.files;
        var connection = await pool.getConnection();

        let selectContentIdxquery = 'SELECT contentsIdx FROM contents WHERE contentsIdx=? '
        let selectUserIdxquery = 'SELECT userIdx FROM user WHERE userIdx=?'

        let result = await connection.query(selectContentIdxquery, [contentsIdx]);
        let result2 = await connection.query(selectUserIdxquery, [userIdx]);

        
        // null값이 보내진 경우
        if(!content || !contentsIdx || !userIdx){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            //잘못된 값이 보내진 경우
        } else if(!result[0] || !result2[0]){  
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        }
            //사진을 2장 이상 첨부한 경우
        else if(files.length > 1){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.TOO_MANY_FILES))
        } else if(files.length == 0){
            let query = 'INSERT INTO comments( content, contentsIdx, userIdx) VALUES (?, ?, ?)'
            await connection.query(query, [content, contentsIdx, userIdx]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        } else {
            const image = files[0].location;
            let query = 'INSERT INTO comments( content, contentsIdx, userIdx, image) VALUES (?, ?, ?, ?)'
            await connection.query(query, [content, contentsIdx, userIdx, image]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));

        }
    } catch(err){
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally{
        connection.release()
    }
});

// 댓글 리스트 가져오기
router.get('/', async(req, res) => {
    try{
        const { contentsIdx } = req.query;
        var connection = await pool.getConnection();

        let selectContentsIdx = 'SELECT contentsIdx FROM comments WHERE contentsIdx = ?'
        let result2 = await connection.query(selectContentsIdx, [contentsIdx]);
        
        // null일 경우
        if(!contentsIdx){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            //잘못된 값이 보내진 경우
        } else if(!result2[0]){  
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        } else{
            let selectCountCommentQuery = 'SELECT count(*) as counting FROM comments WHERE contentsIdx = ?'
            let result = await connection.query(selectCountCommentQuery, [contentsIdx]);
            let query3 = "SELECT c.commentsIdx, c.image, DATE_FORMAT(c.writeTime, '%y.%m.%d %H.%i.%s') as writeTime, c.content, u.userName FROM comments c, user u " 
                        + "WHERE c.userIdx=u.userIdx ORDER BY c.writeTime DESC";
            let result3 = await connection.query(query3);

            let data = {
                "comments_count": result[0].counting,
                "comments": result3
            }
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.READ_SUCCESS, data));
        }

    }catch(err){
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally{
        connection.release();
    }

})

router.delete('/', async(req, res) => {
    try{
        const { commentsIdx, userIdx } = req.body;
        var connection = await pool.getConnection();


        let query1 = 'SELECT commentsIdx FROM comments WHERE commentsIdx = ?'
        let result1 = await connection.query(query1, [commentsIdx]);
        let query2 = 'SELECT userIdx FROM user WHERE userIdx = ?'
        let result2 = await connection.query(query2, [userIdx]);
        console.log(result1);
        console.log(result2);
        
        // null일 경우
        if(!commentsIdx || !userIdx){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        //잘못된 값이 보내진 경우
        
        } else if(!result1[0] || !result2[0]){  
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        } else {
            let deleteQuery = 'DELETE FROM comments WHERE commentsIdx = ?'
            let result = await connection.query(deleteQuery, [commentsIdx]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.DELETE_SUCCESS));
        }

    }catch(err){
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally{
        connection.release();
    }

})

router.put('/', upload.array('image'), async(req, res) => {
    try{
        const { content, commentsIdx, userIdx } = req.body;
        console.log(content);
        const files = req.files;
        var connection = await pool.getConnection();

        let selectContentIdxquery = 'SELECT commentsIdx FROM comments WHERE commentsIdx=? '
        let selectUserIdxquery = 'SELECT userIdx FROM user WHERE userIdx=?'

        let result = await connection.query(selectContentIdxquery, [commentsIdx]);
        let result2 = await connection.query(selectUserIdxquery, [userIdx]);

        
        // null값이 보내진 경우
        if(!content || !commentsIdx || !userIdx){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        //잘못된 값이 보내진 경우
        } else if(!result[0] || !result2[0]){  
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
        }
            //사진을 2장 이상 첨부한 경우
        else if(files.length > 1){
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.TOO_MANY_FILES))
        } else if(files.length == 0){
            let query = 'UPDATE comments SET content=? WHERE commentsIdx=? AND userIdx=?'
            await connection.query(query, [content, commentsIdx, userIdx]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.UPDATE_SUCCESS));
        } else {
            const image = files[0].location;
            console.log(image);
            let query = 'UPDATE comments SET content=?, image=? WHERE commentsIdx=? AND userIdx=?'
            await connection.query(query, [content, image, commentsIdx, userIdx]);
            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.UPDATE_SUCCESS));

        }
    } catch(err){
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally{
        connection.release()
    }
});


module.exports = router;