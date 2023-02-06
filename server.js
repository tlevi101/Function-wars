const createError = require('http-errors');
const express = require('express');
const { DB, SSHConnection } = require('./database/mysql_database');


const app = express();
SSHConnection.then(() => {
  DB.authenticate().then(() => {
    console.log('Connection has been established successfully.');
  }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
  });
}).catch((error) => {
  console.error('Unable to connect via SSH: ', error);
});
// view engine setup

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
