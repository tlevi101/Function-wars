const { expressjwt: jwt } = require("express-jwt");
require("dotenv").config();
module.exports = jwt({
  secret: process.env.JWT_SECRET || "secret",
  algorithms: [process.env.JWT_ALGO || "HS256"],
  requestProperty: "user",
});
