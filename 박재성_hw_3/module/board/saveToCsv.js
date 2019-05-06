const fs = require('fs');
const json2csv = require('async-json2csv');

saveToCsv = async (data) => {
    try {
        const options = {
            data,
            fields: ['id', 'title', 'content', 'date', 'hashedPassword', 'salt'],
            header: true
        };
        const board_csv_data = await json2csv(options);

        fs.writeFile('./board_data.csv', board_csv_data, 'utf8', (err) => {
            if (err) {
                console.log(err);
                throw new Error("fs.writeFile에서 에러 발생");
            }
        })
        console.log("데이터를 csv에 성공적으로 추가했습니다.");
    } catch (err) {
        // 이 코드를 넣으면 작동이 안 된다.
        // 그러면 어떻게 응답코드와 응답 메시지를 보낼 수 있지?
        // res.status(500).json(utils(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        console.log(err);
    }
    
}

module.exports = saveToCsv;