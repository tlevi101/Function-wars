const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const jsonwebtoken = require('jsonwebtoken');
const Client = require("socket.io-client");
const { RuntimeMaps } = require('../types/RuntimeMaps');
const { WaitListController } = require('../types/controllers/WaitListController');

describe('wait list tests', () => {

	let users;
	let admins;
	const userTokens = [];
	const userClients = [];
	let serverSockets = [];
	const adminTokens = [];
	beforeAll(async () => {
		io.listen(3000);
		io.on("connection", (socket) => {
			serverSockets.push(socket);
		});
		const connectionPromises = [];
		users = await User.findAll({
			where: {
				role:'user'
			}
		});
		admins = await User.findAll({
			where: {
				is_admin: true
			}
		});
		for await (const user of users) {
			const token= jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET || 'secret', {
				algorithm: process.env.JWT_ALGORITHM || 'HS256'
			})
			userTokens.push(token);
			const newClient = new Client('http://localhost:3000', {
				query: {
					token: token
				},
				extraHeaders: {
					Authorization: `Bearer ${token}`
				}
			});
			const connectionPromise = new Promise((resolve) => {
				newClient.on("connect", () => {
				  console.log("connected");
				  resolve();
				});
			  });
		  
			connectionPromises.push(connectionPromise);
			userClients.push(newClient);
	
			// newClient.on("connect");
		}
		await Promise.all(connectionPromises);
		for await (const admin of admins) {
			const token = jsonwebtoken.sign(
				admin.toJSONForJWT(),
				process.env.JWT_SECRET || 'secret',
				{
					algorithm: process.env.JWT_ALGORITHM || 'HS256'
				}
			)
			adminTokens.push(token);
		}
	});
	
	
	
	afterAll(() => {
		userClients.forEach((client) => {
			client.close();
		});
		io.close();
	});

	afterEach(async () => {
		serverSockets.map(socket => {
		  socket.removeAllListeners();
		});
		userClients.map(client => {
		  client.removeAllListeners();
		});
	  });
	

	//SOCETSERVICE TESTS
	// test('test online users', async () => {
	// 	const onlineUsers = Array.from(RuntimeMaps.onlineUsers.values());
	// 	await Promise.all(onlineUsers.map((user, index) => {
	// 		console.log(user);
	// 		const userJSON = users[index].toJSON();
	// 		expect(user.user).toEqual(
	// 			expect.objectContaining({
	// 				id: userJSON.id,
	// 				name: userJSON.name,
	// 				email: userJSON.email,
	// 				role: userJSON.role,
	// 				is_admin: userJSON.is_admin,
	// 				banned: userJSON.banned,
	// 				banned_reason: userJSON.banned_reason,
	// 				chat_restriction: userJSON.chat_restriction,
	// 			})
	// 		);
	// 	}));	
	// });
	
	
	test('join wait list success', (done) => {
		expect(RuntimeMaps.waitList.size).toBe(0);
	  
		serverSockets[0].on('join wait list', async () => {
		  await WaitListController.joinWaitList(serverSockets[0]);
		  expect(RuntimeMaps.waitList.size).toBe(1);
			expect(RuntimeMaps.waitList.has(users[0].id)).toBe(true);
			done();
		});
		userClients[0].emit('join wait list');
	  });
	  
	
	test('leave wait list success', (done) => {
		expect(RuntimeMaps.waitList.size).toBe(1);
		console.log(RuntimeMaps.waitList);
		serverSockets[0].on('leave wait list', async () => {
			await WaitListController.leaveWaitList(serverSockets[0]);
			expect(RuntimeMaps.waitList.size).toBe(0);
			expect(RuntimeMaps.waitList.has(users[0].id)).toBe(false);
			done();
		});
		userClients[0].emit('leave wait list');
	});
	
	//TODO try to stress with more users
	test('join wait list with 2 user', (done) => {
		expect(RuntimeMaps.waitList.size).toBe(0);
		const validateGetGameResponse = (response, room) => {
				expect(response.body).toEqual(
					expect.objectContaining({
					  players: expect.arrayContaining([
						expect.objectContaining({
						  id: expect.any(Number),
						  name: expect.any(String),
						  location: {
							x: expect.any(Number),
							y: expect.any(Number),
						  },
						  dimension: {
							height: expect.any(Number),
							width: expect.any(Number),
						  },
						  avoidArea: {
							location: {
									x: expect.any(Number),
									y: expect.any(Number),
							},
							radius: expect.any(Number),
						  },
						}),
					  ]),
					  objects: expect.arrayContaining([
						{
						  type: expect.any(String),
						  location: {
							x: expect.any(Number),
							y: expect.any(Number),
						  },
						  dimension: {
							height: expect.any(Number),
							width: expect.any(Number),
						  },
						  avoidArea:{
							location:{
							  x: expect.any(Number),
							  y: expect.any(Number),
							},
							radius: expect.any(Number),
						  },
						  damages: expect.any(Array),
					  }
					  ]),
					  currentPlayer:{
						id: expect.any(Number),
						name: expect.any(String),
						location: {
						  x: expect.any(Number),
						  y: expect.any(Number),
						},
						dimension: {
						  height: expect.any(Number),
						  width: expect.any(Number),
						},
						avoidArea: {
						  location: {
							x: expect.any(Number),
							y: expect.any(Number),
						  },
						  radius: expect.any(Number),
						},
					  },
					  	field: expect.any(Object),
					  	uuid: room,
					})
				);
		}
		let eventsCompleted = 0;
		let joinedGame = '';
	  
		const checkDone = () => {
			eventsCompleted++;
			console.log('Events completed:', eventsCompleted);
			if (eventsCompleted === 4) {
			  done();
			}
		  }
	  
		serverSockets[0].on('join wait list', async () => {
		  await WaitListController.joinWaitList(serverSockets[0]);
		  expect(RuntimeMaps.waitList.has(users[0].id)).toBe(true);
		  checkDone();
		});

		serverSockets[1].on('join wait list', async () => {
		  await WaitListController.joinWaitList(serverSockets[1]);
		  expect(RuntimeMaps.waitList.has(users[1].id)).toBe(true);
		  checkDone();
		});
	  
		userClients[0].emit('join wait list');
		userClients[1].emit('join wait list');
	  
		userClients[0].on('joined game', async ({room, players, field}) => {
			joinedGame = room;
		  expect(RuntimeMaps.waitList.has(users[0].id)).toBe(false);
		  expect(RuntimeMaps.games.size).toBe(1);
		  expect(RuntimeMaps.games.has(room)).toBe(true);
		  expect(RuntimeMaps.games.get(room).players.length).toBe(2);
		  expect(RuntimeMaps.games.get(room).players.some(player => player.ID == users[0].id)).toBe(true);
		  expect(RuntimeMaps.groupChats.has('chat-'+room)).toBe(true);
		  expect(RuntimeMaps.groupChats.get('chat-'+room).Users.some(player => player.id == users[0].id)).toBe(true);
		  const response = await request.get(`/games/${room}`).set('Authorization', `Bearer ${userTokens[0]}`);
		validateGetGameResponse(response, room);
		  expect(response.status).toBe(200);
		  checkDone();
		});
	  
		userClients[1].on('joined game', async ({room, players, field}) => {
			joinedGame = room;
			expect(RuntimeMaps.waitList.has(users[1].id)).toBe(false);
		  expect(RuntimeMaps.games.size).toBe(1);
		  expect(RuntimeMaps.games.has(room)).toBe(true);
		  expect(RuntimeMaps.games.get(room).players.length).toBe(2);
		  expect(RuntimeMaps.games.get(room).players.some(player => player.ID == users[1].id)).toBe(true);
		  expect(RuntimeMaps.groupChats.has('chat-'+room)).toBe(true);
		  expect(RuntimeMaps.groupChats.get('chat-'+room).Users.some(player => player.id == users[1].id)).toBe(true);
		  const response = await request.get(`/games/${room}`).set('Authorization', `Bearer ${userTokens[0]}`);
		  validateGetGameResponse(response, room);
			expect(response.status).toBe(200); 
		  checkDone();
		});


	  });
	  
	

});	



