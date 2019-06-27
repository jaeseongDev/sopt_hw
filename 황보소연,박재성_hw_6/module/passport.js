module.exports = (passport) => {
    // Passport를 위한 모듈
    const LocalStrategy = require('passport-local').Strategy;
    const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    // DB 이용을 위한 모듈
    const pool = require('../config/dbConfig');

    // 비밀번호 암호화를 위한 모듈
    const cryptoPassword = require('./cryptoPassword');

    // 응답 메시지를 위한 모듈
    var utils = require('./utils/utils');
    var resMessage = require('./utils/responseMessage');
    var statusCode = require('./utils/statusCode');


    // 로컬 로그인 전략(Strategy) : 클라이언트가 '로그인 버튼'을 눌렀을 때 작동하는 내부 알고리즘
    passport.use(new LocalStrategy({
            usernameField: 'userId',
            passwordField: 'userPw'
        },
        async (userId, userPw, done) => {
            try {
                var connection = await pool.getConnection();
                let query = 'SELECT user, userName, userId, loginProvider, snsId FROM user WHERE userId = ?';
                const result = await connection.query(query, [userId]);
                const user = result[0];
                // userId, userPw 중 Null 값이 존재하는 경우
                if (!userId || !userPw) { 
                    done(null, false, utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));

                // 존재하지 않는 아이디인 경우
                } else if (!user) { 
                    done(null, false, utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));

                } else {
                    let salt = user.salt;
                    userPw = await cryptoPassword.hashedPassword(userPw, salt);

                    // 아이디는 있는데 비밀번호가 틀린 경우
                    if (userPw != user.userPw) { 
                        done(null, false, utils.successFalse(statusCode.UNAUTHORIZED, resMessage.LOGIN_FAIL));

                    // 로그인 성공
                    } else if (userPw == user.userPw) {
                        done(null, user);
                    }
                }
            } catch (err) {
                console.log(err);
                done(err);
            } finally {
                connection.release();
            }
        }
    ));

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const {displayName, id} = profile;
            var connection = await pool.getConnection();
            
            let query = 'SELECT * FROM user WHERE snsId = ?';
            const result = await connection.query(query, [id]);
            if (!result[0]) {
                let query = "INSERT INTO user (userName, snsId, loginProvider) VALUES (?, ?, ?)"
                await connection.query(query, [displayName, id, 'google']);    
            }
            const user = result[0];
            done(null, user);
        } catch (err) {
            console.log(err);
            done(err);
        } finally {
            connection.release();
        }
    }));


    // 로그인 요청이 들어왔을 때, user의 정보를 세션에 저장하는 역할 (로그인 요청이 들어왔을 때만 실행된다)
    passport.serializeUser(function (user, done) {
        done(null, user.userIdx);
    });

    // 라우팅의 아무 요청이 들어올 때마다, 세션에 저장되어있는 user의 정보를 req.user에 저장시켜주는 역할
    // 이로 인해 라우터에서 req.user 객체를 사용해서 편리하게 user의 정보를 매번 조회할 수 있다. 
    // (즉, 로그인이 되어있는지 매번 요청때마다 확인이 가능한 것이다.)
    passport.deserializeUser(async (userIdx, done) => {
        try {
            var connection = await pool.getConnection();
            let query = 'SELECT * FROM user WHERE userIdx = ?';
            const result = await connection.query(query, [userIdx]);
            const user = result[0];
            done(null, user);
        } catch (err) {
            console.log(err);
            done(err);
        }
    });
}