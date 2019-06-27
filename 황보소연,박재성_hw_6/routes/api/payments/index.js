var express = require('express');
var router = express.Router();

router.use('/', require('./payments'));




module.exports = router;