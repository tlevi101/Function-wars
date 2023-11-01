require('dotenv').config();
const { io, app, server } = require('./app');
const { overrideConsole } = require('nodejs-better-console');


if(process.env.NODE_ENV === 'development') {
	const { instrument } = require('@socket.io/admin-ui');
	overrideConsole();
	instrument(io, {
		auth: false,
	});
}
//Then redefine the old console

//io.listen(4000);

//console.log('Socket listening on port 4000');
// start server
(async () => {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is running on port ${port}.`);
    });
})();
