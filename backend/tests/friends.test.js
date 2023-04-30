const supertest = require('supertest');
const { app } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const { INTEGER } = require('sequelize');
const friendship = require('../models/friendship');
const { object } = require('joi');

// Replace these with real authentication tokens



const userTokens = [];
/**
 * DB has 5 user in the table from seeder 
 * First user has pending friendShip with the second and the a friendship with third user
 * First user blocked 4th user
 */
describe('FriendsController API tests', () => {

	beforeAll(async () => {
		const USER_COUNT_IN_TEST_DB = await User.count({
			where: {
				role: 'user',
			}
		})
		const keys = [...Array(USER_COUNT_IN_TEST_DB).keys()];
		for await (const index of keys) {
			const response = await request.post('/login')
				.send({
					email: `user${index + 1}@functionWars.com`,
					password: 'password',
				})
				.expect('Content-Type', /json/);
			if (response.body.jwt) {
				userTokens.push(response.body.jwt);
			}
		}
	});



	it('GET /friends - get friends', async () => {
		const response = await request
			.get('/friends')
			.set('Authorization', `Bearer ${userTokens[0]}`);

		expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({

				friends: expect.arrayContaining(
					[
						{
							name: expect.any(String),
							id: 3,
							unreadMessages: 1
						},
						{
							name: expect.any(String),
							id: 4,
							unreadMessages: 0,
						}
					]
				)
			})
		);
	});
	//TODO THIS TEST ALSO BELONGS TO THE SOCKET TESTING
	it('GET /friends/online - get online friends', async () => {
	    const response = await request
	        .get('/friends/online')
	        .set('Authorization', `Bearer ${userTokens[0]}`);
	    expect(response.status).toBe(200);
		expect(response.body).toEqual({
			friends: expect.arrayContaining([])
		}
		);
	});

	it('GET /friends/requests - get friend requests', async () => {
		const response = await request
			.get('/friends/requests')
			.set('Authorization', `Bearer ${userTokens[1]}`);

		expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				requests: expect.arrayContaining([
					{
						id: expect.any(Number),
						from: expect.objectContaining({
							id: 1,
							name: expect.any(String)
						})
					},
				])
			})
		);

		const response2 = await request
			.get('/friends/requests')
			.set('Authorization', `Bearer ${userTokens[4]}`);
		
		expect(response2.status).toBe(200);

		expect(response2.body).toEqual(
			expect.objectContaining({
				requests: expect.arrayContaining([
					{
						id: expect.any(Number),
						from: expect.objectContaining({
							id: 1,
							name: expect.any(String)
						})
					},
				])
			})
		);

	});

	it('GET /friends/:id/chat - get friend chat', async () => {
		const response = await request
			.get(`/friends/${3}/chat`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				chat: expect.objectContaining(
					{
						id: expect.any(Number),
						friendship_id: expect.any(Number),
						messages: expect.arrayContaining([
							{
								from:3,
								message: 'test message',
								seen:false
							}
						])
					}
				)
			})
		)
	});

	it('PUT /friends/requests/:id/accept - accept friend request', async () => {
	    const response = await request
	        .put(`/friends/requests/${1}/accept`)
	        .set('Authorization', `Bearer ${userTokens[1]}`);

	    expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend request accepted.'
			})
		);
	});

	it('DELETE /friends/requests/:id/reject - reject friend request', async () => {
	    const response = await request
	        .delete(`/friends/requests/${2}/reject`)
	        .set('Authorization', `Bearer ${userTokens[4]}`);
	    expect(response.status).toBe(200);


		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend request rejected.'
			})
		);
	});

	it('DELETE /friends/:id - delete friend', async () => {
	    const response = await request
	        .delete(`/friends/${3}`)
	        .set('Authorization', `Bearer ${userTokens[0]}`);
	    expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend deleted.'
			})
		);
	});

	it('POST /friends/:id - send friend request', async () => {
	    const response = await request
	        .post(`/friends/${3}`)
	        .set('Authorization', `Bearer ${userTokens[1]}`);
	    expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend request sent.'
			})
		);
	});

	// it('GET /friends/requests- request received', async () => {
	// 	const response = await request
	// 		.get(`/friends/requests`)
	// 		.set('Authorization', `Bearer ${userTokens[2]}`);
	// 	expect(response.status).toBe(200);

	// 	expect(response.body).toEqual(
	// 		expect.objectContaining({
	// 			requests: expect.arrayContaining([
	// 				{
	// 					id: expect.any(Number),
	// 					from: expect.objectContaining({
	// 						id: 2,
	// 						name: expect.any(String)
	// 					})
	// 				},
	// 			])
	// 		})
	// 	);
	// });
});
