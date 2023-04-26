require('dotenv').config();
const { io, app } = require('./app');
const { instrument } = require('@socket.io/admin-ui');
const { overrideConsole } = require('nodejs-better-console');
overrideConsole();
instrument(io, {
    auth: false,
});
//Then redefine the old console

io.listen(3000);

console.log('Socket listening on port 3000');
// start server
(async () => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}.`);
    });
})();
