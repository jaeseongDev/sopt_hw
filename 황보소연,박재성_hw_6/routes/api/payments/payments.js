var express = require('express');
var router = express.Router();
const pool = require('../../../config/dbConfig');
const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const axios = require('axios');


router.get('/', async(req, res) => {
    res.render('payments');
});

router.post('/test', async(req, res) => {
    console.log(req.body);
    res.send({'aaa': 'bbb', 'status': 'test'});
})

// localhost:3000/api/payments/complete
  // "/payments/complete"에 대한 POST 요청을 처리
router.post('/complete', async (req, res) => {
    try {
        console.log('잘돌아가나??');
        const { imp_uid, merchant_uid } = req.body; // req의 body에서 imp_uid, merchant_uid 추출
        console.log(imp_uid);
        console.log(merchant_uid);
        // 액세스 토큰(access token) 발급 받기
        const getToken = await axios({
            url: "https://api.iamport.kr/users/getToken",
            method: "post", // POST method
            headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
            data: {
                imp_key: process.env.IAMPORT_KEY, // REST API키
                imp_secret: process.env.IAMPORT_SECRET // REST API Secret
            }
        });
        console.log('에러1');
        const { access_token } = getToken.data.response; // 인증 토큰
        // console.log(getToken.data.response);;


        // imp_uid로 아임포트 서버에서 결제 정보 조회
        const getPaymentData = await axios({
            url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
            method: "get", // GET method
            headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
        });
        console.log('에러2');
        const paymentData = getPaymentData.data.response; // 조회한 결제 정보
        // console.log(paymentData);

        // DB에서 결제되어야 하는 금액 조회
        // const order = await Orders.findById(paymentData.merchant_uid); 
        const order = { amount: 100 } // DB라고 가정하자.
        const amountToBePaid = order.amount; // 결제 되어야 하는 금액

        // 결제 검증하기
        const { amount, status } = paymentData;
        
        if (amount === amountToBePaid) { // 결제 금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
            // await Orders.findByIdAndUpdate(merchant_uid, { $set: paymentData }); // DB에 결제 정보 저장
            switch (status) {
                case "ready": // 가상계좌 발급
                    // DB에 가상계좌 발급 정보 저장
                    const { vbank_num, vbank_date, vbank_name } = paymentData;
                    // console.log(vbank_num, vbank_date, vbank_name);
                    // await Users.findByIdAndUpdate("/* 고객 id */", { $set: { vbank_num, vbank_date, vbank_name }});
                    // 가상계좌 발급 안내 문자메시지 발송
                    SMS.send({ text: `가상계좌 발급이 성공되었습니다. 계좌 정보 ${vbank_num} ${vbank_date} ${vbank_name}`});
                    res.send({ status: "vbankIssued", message: "가상계좌 발급 성공" });
                    break;
                case "paid": // 결제 완료
                    res.send({ status: "success", message: "일반 결제 성공" });
                break;
            }
        } else { // 결제 금액 불일치. 위/변조 된 결제
            throw { status: "forgery", message: "위조된 결제시도" };
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

// "/iamport-webhook"에 대한 POST 요청을 처리
router.post('/iamport-webhook', async (req, res) => {
    try {
        console.log('웹 훅!!');
        const { imp_uid, merchant_uid } = req.body; // req의 body에서 imp_uid, merchant_uid 추출
        // 액세스 토큰(access token) 발급 받기
        const getToken = await axios({
            url: "https://api.iamport.kr/users/getToken",
            method: "post", // POST method
            headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
            data: {
              imp_key: process.env.IAMPORT_KEY, // REST API키
              imp_secret: process.env.IAMPORT_SECRET // REST API Secret
            }
        });
        const { access_token } = getToken.data.response; // 인증 토큰
        // imp_uid로 아임포트 서버에서 결제 정보 조회
        console.log(`https://api.iamport.kr/payments/${imp_uid}`);
        const getPaymentData = await axios({
            url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
            method: "get", // GET method
            headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
        });
        const paymentData = getPaymentData.data.response; // 조회한 결제 정보
        // console.log(paymentData);
        // DB에서 결제되어야 하는 금액 조회
        // const order = await Orders.findById(paymentData.merchant_uid);
        const order = {amount: 100} // DB라고 가정하자.
        const amountToBePaid = order.amount; // 결제 되어야 하는 금액
        console.log('체크2');
        const { amount, status } = paymentData;
        console.log('status', status);
        if (amount === amountToBePaid) { // 결제 금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
            // await Orders.findByIdAndUpdate(merchant_uid, { $set: paymentData }); // DB에 결제 정보 저장
            switch (status) {
                case "ready": // 가상계좌 발급
                    // DB에 가상계좌 발급 정보 저장
                    const { vbank_num, vbank_date, vbank_name } = paymentData;
                    // await Users.findByIdAndUpdate("/* 고객 id */", { $set: { vbank_num, vbank_date, vbank_name }});
                    // 가상계좌 발급 안내 문자메시지 발송
                    // SMS.send({ text: `가상계좌 발급이 성공되었습니다. 계좌 정보 ${vbank_num} ${vbank_date} ${vbank_name}`});
                    res.send({ status: "vbankIssued", message: "가상계좌 발급 성공" });
                    break;
                case "paid": // 결제 완료
                    res.send({ status: "success", message: "일반 결제 성공" });
                    break;
                default:
                    
            }
        } else { // 결제 금액 불일치. 위/변조 된 결제
            throw { status: "forgery", message: "위조된 결제시도" };
        }
        res.send({'alsdnkfank': 'alsdknflaf'});
    } catch (e) {
        console.log('에러 발생');
        res.status(400).send(e);
    }
});



module.exports = router;