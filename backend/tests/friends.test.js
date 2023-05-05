const supertest = require('supertest');
const { app } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const jsonwebtoken = require('jsonwebtoken');
const { Op } = require('sequelize');

/**
 * DB has 8 user in the table from seeder 
 * Friendships: {user1-user2, pending-yes}, {user1-user3, pending-no}, {user1-user4, pending-no}, {user1-user5, pending-yes} 
 * First user blocked 8th user
 * userTokens: Contains valid tokens for users 1-7, expect 5th user because banned, it is undefined
 * badToken contains a token where user is not found in the DB
 * guestToken
 */
const getUserTokens= async () => {

	const badToken = jsonwebtoken.sign(
		{
			type: 'user',
			id: 0,
			name: 'USer with bad token',
			email: 'user2102102102@functionWars.com',
			banned: false,
			banned_reason: null,
			is_admin: false,
			role: 'user',
			JWT_createdAt: new Date(),
			chat_restriction: false,
		},
		process.env.JWT_SECRET || 'secret',
		{
			algorithm: process.env.JWT_ALGO || 'HS256',
		}
	)

	const userTokens = [];
	const USER_COUNT_IN_TEST_DB = await User.count({
		where: {
			email: {[Op.like]:'user%'},
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
		userTokens.push(response.body.jwt);
	}
	const response = await request
			.post('/register-guest')
			.send({ name: 'test guest' })
			.expect('Content-Type', /json/)
			.expect(201)
	return {userTokens, guestToken: response.body.jwt, badToken};
}


describe('FriendsController API tests when token is is valid, but user is not found', () => {

	let guestToken, userTokens, badToken;

	beforeAll(async () => {
		({userTokens, guestToken, badToken} = await getUserTokens());
	});

    test('GET /friends/requests', async () => {
        const response = await request.get('/friends/requests')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

    test('GET /friends/:id/chat', async () => {
        const response = await request.get('/friends/1/chat')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

    test('PUT /friends/request/:id/accept', async () => {
        const response = await request.put('/friends/requests/1/accept')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

    test('DELETE /friends/request/:id/reject', async () => {
        const response = await request.delete('/friends/requests/1/reject')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

    test('DELETE  /friends/:id', async () => {
        const response = await request.delete('/friends/1')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

    test('POST /friends/:id ', async () => {
        const response = await request.post('/friends/1')
            .set('Authorization', `Bearer ${badToken}`);
        
		
		expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Bad token! User not found.' });
    });

});



describe('FriendsController API tests when a guest making the request', () => {
	
	let guestToken, userTokens;


	beforeAll(async () => {
		({userTokens, guestToken} = await getUserTokens());
	});



	test('GET /friends - guest cannot make request', async () => {
        const response = await request.get('/friends')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('GET /friends/online - guest cannot make request', async () => {
        const response = await request.get('/friends/online')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('GET /friends/requests - guest cannot make request', async () => {
        const response = await request.get('/friends/requests')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('GET /friends/:id/chat - guest cannot make request', async () => {
        const response = await request.get('/friends/1/chat')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('PUT /friends/requests/:id/accept - guest cannot make request', async () => {
        const response = await request.put('/friends/requests/1/accept')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('DELETE /friends/requests/:id/reject - guest cannot make request', async () => {
        const response = await request.delete('/friends/requests/1/reject')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('DELETE /friends/:id - guest cannot make request', async () => {
        const response = await request.delete('/friends/1')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
    });

    test('POST /friends/:id - guest cannot make request', async () => {
        const response = await request.post('/friends/1')
            .set('Authorization', `Bearer ${guestToken}`);
			expect(response.status).toBe(403)
			expect(response.body).toEqual(
				expect.objectContaining({
					message: 'Guest cannot make this request!',
				})
			)
	});
});




describe('FriendsController API tests on GET /friends/:id/chat remaining failure cases', () => {
	let userTokens;
	beforeAll(async () => {
		({ userTokens } = await getUserTokens());
	});
	
	test('friend not found', async () => {
		const response = await request
			.get(`/friends/${100}/chat`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		expect(response.status).toBe(404);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend not found.'
			})
		)
	});


	test ('friendship not found', async () => {
		const response = await request
			.get(`/friends/${5}/chat`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		expect(response.status).toBe(404);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friendship not found.'
			})
		)
	});
});


describe('FriendsController API tests on PUT /friends/requests/:id/accept remaining failure cases', () => {
	let userTokens;
	beforeAll(async () => {
		({ userTokens } = await getUserTokens());
	});
	test('friend request not found', async () => {
	    const response = await request
	        .put(`/friends/requests/${100}/accept`)
	        .set('Authorization', `Bearer ${userTokens[1]}`);

	    expect(response.status).toBe(404);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend request not found.'
			})
		);
	});

	test('User is not the recipient', async () => {
		const response = await request
			.put(`/friends/requests/${1}/accept`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		expect(response.status).toBe(403);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'You are not the recipient of this friendship request.'
			})
		);
	});
});


describe('FriendsController API tests on DELETE /friends/requests/:id/reject remaining failure cases', () => {
	let userTokens;
	beforeAll(async () => {
		({ userTokens } = await getUserTokens());
	});


	test('friend request not found', async () => {
	    const response = await request
	        .delete(`/friends/requests/${100}/reject`)
	        .set('Authorization', `Bearer ${userTokens[1]}`);

	    expect(response.status).toBe(404);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend request not found.'
			})
		);
	});

	test('User is not the recipient', async () => {
		const response = await request
			.delete(`/friends/requests/${1}/reject`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		
		expect(response.status).toBe(403);
		
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'You are not the recipient of this friendship request.'
			})
		);
	});
});


describe('FriendsController API tests on DELETE /friends/:id remaining failure cases', () => {
	let userTokens;
	beforeAll(async () => {
		({ userTokens } = await getUserTokens());
	});

	test('DELETE /friends/:id friend not found', async () => {
	    const response = await request
	        .delete(`/friends/${100}`)
	        .set('Authorization', `Bearer ${userTokens[0]}`);
	    expect(response.status).toBe(404);

		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend not found.'
			})
		);
	});

	test('DELETE /friends/:id User is not part of the friendship', async () => {
		const response = await request
			.delete(`/friends/${7}`)
			.set('Authorization', `Bearer ${userTokens[0]}`);

		console.log(response.status);
		console.log(response.body);
		expect(response.status).toBe(404);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Friend not found.'
			})
		);
	});

	test('DELETE /friends/:id User wants to delete pending friendship', async () => {
		const response = await request
			.delete(`/friends/${2}`)
			.set('Authorization', `Bearer ${userTokens[0]}`);

		expect(response.status).toBe(403);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: "You can't delete a pending friendship."
			})
		);
	});
});


describe('FriendsController API tests on POST /friends/:id (add friend) remaining failure cases', () => {
	let userTokens;
	beforeAll(async () => {
		({ userTokens } = await getUserTokens());
	});

	test('POST /friends/:id other user not found', async () => {
		const response = await request
			.post(`/friends/${100}`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		
		expect(response.status).toBe(404);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'User not found.'
			})
		);
	});

	test('POST /friends/:id other user tried to add himself', async () => {
		const response = await request
			.post(`/friends/${1}`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		
		expect(response.status).toBe(403);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: "You can't add yourself as a friend."
			})
		);
	});
});


describe('FriendsController API tests on success', () => {
	
	let userTokens;
	
	beforeAll(async () =>{
		const obj = await getUserTokens();
		userTokens = obj.userTokens;
	});



	test('GET /friends - get friends', async () => {
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
	test('GET /friends/online - get online friends', async () => {
	    const response = await request
	        .get('/friends/online')
	        .set('Authorization', `Bearer ${userTokens[0]}`);
	    expect(response.status).toBe(200);
		expect(response.body).toEqual({
			friends: expect.arrayContaining([])
		}
		);
	});

	test('GET /friends/requests - get friend requests', async () => {
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

	test('GET /friends/:id/chat - get friend chat', async () => {
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

	test('GET /friends/:id/chat - get friend chat empty', async () => {
		const response = await request
			.get(`/friends/${4}/chat`)
			.set('Authorization', `Bearer ${userTokens[0]}`);
		expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				chat: expect.objectContaining(
					{
						id: expect.any(Number),
						friendship_id: expect.any(Number),
						messages: expect.arrayContaining([])
					}
				)
			})
		)
		expect(response.body.chat.messages.length).toBe(0);
	});

	test('PUT /friends/requests/:id/accept - accept friend request', async () => {
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

	test('DELETE /friends/requests/:id/reject - reject friend request', async () => {
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

	test('DELETE /friends/:id - delete friend', async () => {
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

	test('POST /friends/:id - send friend request', async () => {
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

	test('GET /friends/requests- request received', async () => {
		const response = await request
			.get(`/friends/requests`)
			.set('Authorization', `Bearer ${userTokens[2]}`);
		expect(response.status).toBe(200);

		expect(response.body).toEqual(
			expect.objectContaining({
				requests: expect.arrayContaining([
					{
						id: expect.any(Number),
						from: expect.objectContaining({
							id: 2,
							name: expect.any(String)
						})
					},
				])
			})
		);
	});
});


