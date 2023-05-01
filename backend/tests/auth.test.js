const request = require('supertest');
const{ app } = require('../app');
const { User } = require('../models');
const jsonwebtoken = require('jsonwebtoken');


describe('AuthController test cases ', () => {
    test('POST /register-guest name is missing', () => {
        return request(app)
            .post('/register-guest')
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Name is required',
                    })
                );
            });
    });

    test('POST /register-guest name is too short', () => {
        return request(app)
            .post('/register-guest')
            .send({ name: 'a' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Name is must be between 3 and 20 characters long',
                    })
                );
            });
    });

    test('POST /register-guest name is too long', () => {
        return request(app)
            .post('/register-guest')
            .send({ name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Name is must be between 3 and 20 characters long',
                    })
                );
            });
    });

    test('POST /register-guest everything went well', async () => {
        const response =  await request(app)
            .post('/register-guest')
            .send({ name: 'test' })
            .expect('Content-Type', /json/)
            .expect(201);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Guest accepted',
				jwt: expect.any(String),
			})
		);

		const decoded = jsonwebtoken.verify(response.body.jwt, process.env.JWT_SECRET || 'secret');
		expect(decoded).toEqual(
			expect.objectContaining({
				type: 'guest',
				name: 'Guest: test',
				id: expect.any(String),
				guest:true,
				JWT_createdAt: expect.any(String),
				iat: expect.any(Number),
			})
		);
    });

    test('POST /register password is missing', () => {
        return request(app)
            .post('/register')
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password is required',
                    })
                );
            });
    });

    test('POST /register password confirmation is missing', () => {
        return request(app)
            .post('/register')
            .send({ password: 'test' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password confirmation is required (passwordAgain)',
                    })
                );
            });
    });

    test('POST /register passwords do not match', () => {
        return request(app)
            .post('/register')
            .send({ password: 'test', passwordAgain: 'test2' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Passwords do not match',
                    })
                );
            });
    });

    test('POST /register password is too short', () => {
        return request(app)
            .post('/register')
            .send({ password: 'test', passwordAgain: 'test' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('POST /register password is too long', () => {
        return request(app)
            .post('/register')
            .send({
                password: 'aaaaaaaaaaaaaaaaaaaaa',
                passwordAgain: 'aaaaaaaaaaaaaaaaaaaaa',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('POST /register name and email is missing', () => {
        return request(app)
            .post('/register')
            .send({ password: '12345678', passwordAgain: '12345678' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'notNull Violation: User.name cannot be null,\nnotNull Violation: User.email cannot be null',
                    })
                );
            });
    });

    test('POST /register name is too short', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'a',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Username must be between 3 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('POST /register name is too long', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Username must be between 3 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('POST /register email is invalid', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'test',
                email: 'test',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining('Validation error: Invalid email address'),
                    })
                );
            });
    });

    test('POST /register everything went well', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                name: 'test',
                email: 'test@test.com',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(201);
                expect(response.body).toEqual(
                    expect.objectContaining({
                        message: 'User created',
                        jwt: expect.any(String),
                    })
                );
			const decoded = jsonwebtoken.verify(response.body.jwt, process.env.JWT_SECRET || 'secret');
			expect(decoded).toEqual(
				expect.objectContaining({
					type: 'user',
					id: expect.any(Number),
					name: 'test',
					email: 'test@test.com',
					banned: false,
					banned_reason: null,
					is_admin: false,
					role: 'user',
					JWT_createdAt: expect.any(String),
					chat_restriction: false,
				})
			);
    });

    test('POST /register name already exists', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'test',
                email: 'test2@test.com',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'users_name must be unique',
                    })
                );
            });
    });

    test('POST /register email already exists', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'test2',
                email: 'test@test.com',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'users_email must be unique',
                    })
                );
            });
    });

    test('POST /register second user is created', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'test2',
                email: 'test2@test.com',
                password: '12345678',
                passwordAgain: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(201)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'User created',
                        jwt: expect.any(String),
                    })
                );
            });
    });

    test('POST /login email missing', () => {
        return request(app)
            .post('/login')
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Email required',
                    })
                );
            });
    });

    test('POST /login incorrect email', () => {
        return request(app)
            .post('/login')
            .send({ email: 'test3@test.com' })
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Incorrect email',
                    })
                );
            });
    });

	/**
	 * @email user6... (@name: banned user) is banned
	 */
    test('POST /login user banned', () => {
        return request(app)
            .post('/login')
            .send({ email: 'user6@functionWars.com' })
            .expect('Content-Type', /json/)
            .expect(403)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'User banned',
                        banned_reason: expect.any(String),
                    })
                );
            });
    });

    test('POST /login password missing', () => {
        return request(app)
            .post('/login')
            .send({ email: 'test@test.com' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password required',
                    })
                );
            });
    });

    test('POST /login incorrect password', () => {
        return request(app)
            .post('/login')
            .send({
                email: 'test@test.com',
                password: '1234589',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Incorrect password',
                    })
                );
            });
    });

    test('POST /login everything went well', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: 'test@test.com',
                password: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Login successful',
				jwt: expect.any(String),
			})
		);
		const decoded = jsonwebtoken.verify(response.body.jwt, process.env.JWT_SECRET || 'secret');
			expect(decoded).toEqual(
				expect.objectContaining({
					type: 'user',
					id: expect.any(Number),
					name: 'test',
					email: 'test@test.com',
					banned: false,
					banned_reason: null,
					is_admin: false,
					role: 'user',
					JWT_createdAt: expect.any(String),
					chat_restriction: false,
				})
			);
    });

    test('POST /forgot-password email missing', () => {
        return request(app)
            .post('/forgot-password')
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Email required',
                    })
                );
            });
    });

    test('POST /forgot-password incorrect email', () => {
        return request(app)
            .post('/forgot-password')
            .send({ email: 'test5@test.com' })
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Incorrect email',
                    })
                );
            });
    });

    test('POST /forgot-password user banned', () => {
        return request(app)
            .post('/forgot-password')
            .send({ email: 'user6@functionWars.com' })
            .expect('Content-Type', /json/)
            .expect(403)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'User banned',
                        banned_reason: expect.any(String),
                    })
                );
            });
    });

    test('POST /forgot-password everything went well', () => {
        return request(app)
            .post('/forgot-password')
            .send({ email: 'test@test.com' })
            .expect('Content-Type', /json/)
            .expect(201)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Email sent',
                        uuid: expect.any(String),
                    })
                );
            });
    });

	test('POST /forgot-password forgot password resent ', () => {
        return request(app)
            .post('/forgot-password')
            .send({ email: 'test@test.com' })
            .expect('Content-Type', /json/)
            .expect(201)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Email sent',
                        uuid: expect.any(String),
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid uuid is missing', () => {
        return request(app)
            .put('/reset-password/')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Route not found',
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid uuid is incorrect', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put(`/reset-password/${uuid}1`)
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Incorrect link',
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid link expired', async () => {
		const user =  await User.findOne({where:{
			email: 'user8@functionWars.com'
		}});
        const passwordReset = await user.getPasswordReset();
		const uuid = passwordReset.getUuid();
        return request(app)
            .put(`/reset-password/${uuid}`)
            .send({ password: '12345678', passwordAgain: '12345678' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
				expect(res.body).toEqual(
					expect.objectContaining({
						message: 'Link expired',
					})
				)
			});
    });

    test('PUT /reset-password/:uuid password missing', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password required',
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid passwordAgain is missing', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send({ password: '123456' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password confirmation required (passwordAgain)',
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid password and passwordAgain are not the same', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send({ password: '123456', passwordAgain: '1234567' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Passwords do not match',
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid password too short', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send({ password: '1234567', passwordAgain: '1234567' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid password too short', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send({
                password: '123456781234567812345678',
                passwordAgain: '123456781234567812345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    test('PUT /reset-password/:uuid everything went well', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/reset-password/' + uuid)
            .send({ password: '12345678', passwordAgain: '12345678' })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Password updated',
                    })
                );
            });
    });
});



describe('AuthController - update token', () => {
	let token;
	let badToken;
	let guestToken;

	beforeAll(async () => {
		const response = await request(app)
				.post('/login')
				.send({
					email: 'user1@functionWars.com',
					password: 'password'
				});
		token = response.body.jwt;

		const responseGuest = await request(app)
			.post('/register-guest')
			.send({ name: 'test guest' })
			.expect('Content-Type', /json/)
			.expect(201)
		guestToken = responseGuest.body.jwt;
		console.log(responseGuest.body);
		console.log(responseGuest.body.jwt);
		badToken = jsonwebtoken.sign(
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
	});


	test('Guest token', async () => {
		return request(app)
			.get('/update-token')
			.set('Authorization', `Bearer ${guestToken}`)
			.expect('Content-Type', /json/)
			.expect(403)
			.then(res => {
				expect(res.body).toEqual(
					expect.objectContaining({
						message: 'Guest cannot make this request!',
					})
				);
			});
	});


	test('Bad token', async () => {
		return request(app)
			.get('/update-token')
			.set('Authorization', `Bearer ${badToken}`)
			.expect('Content-Type', /json/)
			.expect(404)
			.then(res => {
				expect(res.body).toEqual(
					expect.objectContaining({
						message: 'User not found',
					})
				);
			});
	});

	test('Everything went well', async () => {
		const response =  await request(app)
			.get('/update-token')
			.set('Authorization', `Bearer ${token}`)
			.expect('Content-Type', /json/)
			.expect(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				message: 'Token updated',
				jwt: expect.any(String),
			})
		);
	});
});