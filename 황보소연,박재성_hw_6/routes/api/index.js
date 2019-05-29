var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/webtoons', require('./webtoons'));

module.exports = router;