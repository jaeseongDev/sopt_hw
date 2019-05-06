var express = require('express');
var router = express.Router();

router.use('/board', require('./board'));

module.exports = router;