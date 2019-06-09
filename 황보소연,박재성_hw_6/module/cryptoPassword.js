const crypto = require('crypto-promise');
const cryptoPassword = {};

// 랜덤 함수로 salt 생성
cryptoPassword.salt = async () => {
    try {
        const saltBuffer = await crypto.randomBytes(32);
        const salt = saltBuffer.toString('base64');
        
        return salt;
    } catch (err) {
        console.log(err);
    }
}

// 해쉬화된 패스워드 출력
cryptoPassword.hashedPassword = async (password, salt) => {
    try {
        const hashedPasswordBuffer = await crypto.pbkdf2(password, salt , 1000, 32, 'SHA512');
        const hashedPassword = hashedPasswordBuffer.toString('base64'); 
        return hashedPassword;  
    } catch (err) {
        console.log(err);
    }
}

module.exports = cryptoPassword;