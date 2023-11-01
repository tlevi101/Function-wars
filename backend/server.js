require('dotenv').config();
const { io, app } = require('./app');
const { overrideConsole } = require('nodejs-better-console');


if(process.env.NODE_ENV === 'development') {
	const { instrument } = require('@socket.io/admin-ui');
	overrideConsole();
	instrument(io, {
		auth: false,
	});
}
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
