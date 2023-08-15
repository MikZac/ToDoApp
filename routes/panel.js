const express = require('express');
const router = express.Router();
const { format } = require('date-fns');

router.get('/', (req, res) => {
    try {
        const userTasks = res.locals.userTasks;
        res.render('panel', { tasks: userTasks, format });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;