var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/webtoons', require('./webtoons'));
router.use('/payments', require('./payments'));

module.exports = router;