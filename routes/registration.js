const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('register', { success: res.locals.success, error: null });
});
module.exports = router;