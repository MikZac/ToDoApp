const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');


const app = express();

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

app.locals.formatDate = formatDate;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs'); // Ustawienie silnika szablonów EJS

app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "todoapp"
});
app.locals.db = db;
app.use((req, res, next) => {
    res.locals.success = req.query.success === 'true';
    next();
})

// ... pozostały kod ...

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const registrationRouter = require('./routes/registration');
app.use('/registration', registrationRouter);

const loginRouter = require('./routes/login');
app.use('/login', loginRouter);

app.use((req, res, next) => {

    const db = res.app.locals.db;
    const userID = req.session.userID;
    db.query('SELECT * FROM tasks WHERE user_id = ?', [userID], (err, userTasks) => {
        if (err) {
            console.error('Błąd podczas pobierania zadań z bazy danych:', err);
            return res.status(500).json({ message: 'Błąd serwera' });
        }

        res.locals.userTasks = userTasks; // Zapisz wyniki jako właściwość lokalną
        next();
    });
})


const panelRouter = require('./routes/panel')
const checkAuth = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    }
    return res.redirect('/login');
};
app.use('/panel', checkAuth, panelRouter);
app.use(express.static(path.join(__dirname, 'public')));

const addTaskRouter = require('./routes/addTask');
app.use('/addTask', checkAuth, addTaskRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/addTask', (req, res) => {
    const name = req.body.taskName;
    const add_date = new Date();
    const end_date = req.body.endDate;
    const status = req.body.taskStatus;
    const user_id = req.session.userID;
    console.log(name, add_date, end_date, status); 
    
    const query = `INSERT INTO tasks (name, add_date, end_date, status, user_id) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [name, add_date, end_date, status, user_id], (err, result) => {
        
        if(err) {
            console.log(err);
            return res.status(500).send(`Błąd podczas dodawania zadania`);
        }
            res.redirect('/panel');
        
        
    })
})

app.use('/deleteTask', checkAuth);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/deleteTask', (req, res) => {
    const id = req.body.taskId;
    console.log(id);
    const query = `DELETE FROM tasks WHERE id = (?)`;
    db.query(query, [id], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send(`Błąd podczas usuwania zadania`);

        }
        res.redirect('/panel');
    })
})

app.use('/statusTask', checkAuth);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/statusTask', (req, res) => {
    const id = req.body.taskId;
    const newStatus = req.body.status;

    const query = `UPDATE tasks SET status = ? WHERE id = ?`;
    db.query(query, [newStatus, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(`Błąd podczas zmiany statusu zadania`);
        }

        res.redirect('/panel');
    });
});

const updateTaskRouter = require('./routes/updateTask')(db);
app.use('/updateTask', checkAuth, updateTaskRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    
    const query = `SELECT * FROM user WHERE email = ? AND password = ?`;

    db.query(query, [email, password], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send(`Błąd podczas sprawdzania użytkownika`);
        }

        if(result.length === 1) {
            req.session.isLoggedIn = true;
            req.session.userID = result[0].id;
            res.redirect('/panel')
        }
        else {
            res.render('login', {error: 'Bład podczas logowania'});
        }
    })

});

app.post('/registration', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (!name || !email || !password) {
        return res.render('register', { error: 'Wypełnij wszystkie pola' });
    }

    // Sprawdź, czy adres e-mail już istnieje w bazie danych
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Błąd podczas sprawdzania adresu e-mail');
        }

        if (result.length > 0) {
            // Adres e-mail już istnieje, przekazujemy błąd do widoku
            return res.render('register', { error: 'Adres e-mail już istnieje' });
        }
    
        // Adres e-mail nie istnieje, możemy dokonać rejestracji
        const insertQuery = `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`;
        db.query(insertQuery, [name, email, password], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Błąd podczas zapisywania do bazy danych');
            }
            console.log('Użytkownik zarejestrowany');
    
            // Wyrenderowanie strony z dodatkowym parametrem
            res.redirect('/registration/?success=true');
        });
    });
});

app.listen(3000, () => {
    console.log('Server listen on port 3000');
});
