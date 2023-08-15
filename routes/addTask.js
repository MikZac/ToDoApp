const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('addTask', { error: null });
});

module.exports = router;