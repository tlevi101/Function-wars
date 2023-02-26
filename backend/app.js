require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const date = require("date-and-time");
const { Sequelize } = require("sequelize");
require("express-async-errors");
const fs = require("fs").promises;
const app = express();

// parse requests of content-type - application/json
app.use(express.json());

//routers
app.use("/", require("./routes/auth"));
app.use("/admin/", require("./routes/admin"));
app.use("/user/", require("./routes/user"));
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// catch any sequelize validation errors
app.use(function (err, req, res, next) {
  if (err instanceof Sequelize.UniqueConstraintError) {
    res.status(400).json({ error: err.errors[0].message });
  } else if (err instanceof Sequelize.ValidationError) {
    res.status(400).json({ error: err.message });
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
  await fs.appendFile(
    `logs/${date.format(new Date(), "YYYY. MM. DD")}.log`,
    [
      `[${date.format(new Date(), "HH:mm:ss")}]\n`,
      "Name: " + err.name,
      "Message: " + err.message,
      "Stack:\n" + err.stack,
    ].join("\n") + "\n\n"
  );
  // render the error page
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;