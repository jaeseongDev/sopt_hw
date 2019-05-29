var express = require('express');
var router = express.Router();

router.use('/', require('./webtoons'));
router.use('/episodes', require('./episodes'));
router.use('/episodes/contents', require('./contents'));
router.use('/episodes/comments', require('./comments'));
router.use('/likes', require('./likes'));

module.exports = router;