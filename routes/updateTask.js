const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/:taskId', (req, res) => {
        const taskId = req.params.taskId;

        // Pobierz zadanie z bazy danych na podstawie taskId i przekaż je do szablonu
        db.query('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
            if (err) {
                console.error('Błąd podczas pobierania zadania z bazy danych:', err);
                return res.status(500).json({ message: 'Błąd serwera' });
            }

            res.render('updateTask', { error: null, task: task[0] });
        });
    });

    router.post('/:taskId', (req, res) => {
        const taskId = req.params.taskId;
        const name = req.body.taskName;
        const end_date = req.body.taskEndDate;
        const status = req.body.taskStatus;
        console.log(name, end_date, status)
    
        const query = `UPDATE tasks SET name = ?, end_date = ?, status = ? WHERE id = ?`;
        db.query(query, [name, end_date, status, taskId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(`Błąd podczas zmiany zadania`);
            }
    
            res.redirect('/panel');
        });
    });

    return router;
};