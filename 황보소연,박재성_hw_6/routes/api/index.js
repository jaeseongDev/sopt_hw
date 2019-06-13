var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/webtoons', require('./webtoons'));
router.use('/', (req, res) => {
    res.render('login');
})

module.exports = router;