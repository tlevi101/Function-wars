require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const date = require('date-and-time');
const { Sequelize } = require('sequelize');
require('express-async-errors');
const fs = require('fs').promises;
const app = express();
const cors = require('cors');

// parse requests of content-type - application/json
app.use(express.json());
app.use(cors());

//routers
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/fields'));
app.use('/admin/', require('./routes/admin'));
app.use('/', require('./routes/user'));
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// catch any sequelize validation errors
app.use(function (err, req, res, next) {
    if (err instanceof Sequelize.UniqueConstraintError) {
        res.status(400).json({ msg: err.errors[0].message });
    } else if (err instanceof Sequelize.ValidationError) {
        res.status(400).json({ msg: err.message });
    }
    // else if (err instanceof Sequelize.DatabaseError) {
    //   res.status(400).json({ error: err.message });
    // }
    next(err, req, res, next);
});

// error logger
app.use(async function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    const time = date.format(new Date(), 'HH:mm:ss');
    const error = {
        [time.toString()]: {
            name: err.name,
            message: err.message,
            stack: err.stack.split('\n'),
            req: {
                body: req.body,
                params: req.params,
                headers: req.headers,
                url: req.url,
            },
        },
    };
    try {
        const log = await fs.readFile(`logs/${date.format(new Date(), 'YYYY. MM. DD')}.json`, 'utf8');
        const json = JSON.parse(log);
        json.push(error);
        await fs.writeFile(`logs/${date.format(new Date(), 'YYYY. MM. DD')}.json`, JSON.stringify(json));
    } catch (e) {
        await fs.writeFile(`logs/${date.format(new Date(), 'YYYY. MM. DD')}.json`, JSON.stringify([error]));
    }
    res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
