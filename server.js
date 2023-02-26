require("dotenv").config();
const app = require("./app");

// start server
(async () => {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
  });
})();
