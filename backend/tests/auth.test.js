const request = require('supertest');
const app = require('../app');
const { User } = require('../models');

describe('POST /', () => {
    it('POST /register-guest name is missing', () => {
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

    it('POST /register-guest name is too short', () => {
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

    it('POST /register-guest name is too long', () => {
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

    it('POST /register-guest everything went well', () => {
        return request(app)
            .post('/register-guest')
            .send({ name: 'test' })
            .expect('Content-Type', /json/)
            .expect(201)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Guest accepted',
                        jwt: expect.any(String),
                    })
                );
            });
    });

    it('POST /register password is missing', () => {
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

    it('POST /register password confirmation is missing', () => {
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

    it('POST /register passwords do not match', () => {
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

    it('POST /register password is too short', () => {
        return request(app)
            .post('/register')
            .send({ password: 'test', passwordAgain: 'test' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        error: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('POST /register password is too long', () => {
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
                        error: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('POST /register name and email is missing', () => {
        return request(app)
            .post('/register')
            .send({ password: '12345678', passwordAgain: '12345678' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        error: 'notNull Violation: User.name cannot be null,\nnotNull Violation: User.email cannot be null',
                    })
                );
            });
    });

    it('POST /register name is too short', () => {
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
                        error: expect.stringContaining(
                            'Validation error: Username must be between 3 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('POST /register name is too long', () => {
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
                        error: expect.stringContaining(
                            'Validation error: Username must be between 3 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('POST /register email is invalid', () => {
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
                        error: expect.stringContaining('Validation error: Invalid email address'),
                    })
                );
            });
    });

    it('POST /register everything went well', () => {
        return request(app)
            .post('/register')
            .send({
                name: 'test',
                email: 'test@test.com',
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

    it('POST /register name already exists', () => {
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
                        error: 'users_name must be unique',
                    })
                );
            });
    });

    it('POST /register email already exists', () => {
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
                        error: 'users_email must be unique',
                    })
                );
            });
    });

    it('POST /register second user is created', () => {
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

    it('POST /login email missing', () => {
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

    it('POST /login incorrect email', () => {
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

    // TODO: create a banned test user with seeder
    it('POST /login user banned', () => {
        return request(app)
            .post('/login')
            .send({ email: 'banned@test.com' })
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

    it('POST /login password missing', () => {
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

    it('POST /login incorrect password', () => {
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

    it('POST /login everything went well', () => {
        return request(app)
            .post('/login')
            .send({
                email: 'test@test.com',
                password: '12345678',
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'Login successful',
                        jwt: expect.any(String),
                    })
                );
            });
    });

    it('POST /forgot-password email missing', () => {
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

    it('POST /forgot-password incorrect email', () => {
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

    //TODO: create a banned test user with seeder
    it('POST /forgot-password user banned', () => {
        return request(app)
            .post('/forgot-password')
            .send({ email: 'banned@test.com' })
            .expect('Content-Type', /json/)
            .expect(403)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        message: 'User is banned',
                        banned_reason: expect.any(String),
                    })
                );
            });
    });

    it('POST /forgot-password everything went well', () => {
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

    it('PUT /password-reset/:uuid uuid is missing', () => {
        return request(app)
            .put('/password-reset/')
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

    it('PUT /password-reset/:uuid uuid is incorrect', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid + '1')
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

    // TODO: create test0 user with seeder and a pasword reset for test0 user
    it('PUT /password-reset/:uuid link expired', async () => {
        return request(app)
            .put('/password-reset/')
            .send({ password: '1234567', passwordAgain: '1234567' })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {});
    });

    it('PUT /password-reset/:uuid password missing', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
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

    it('PUT /password-reset/:uuid passwordAgain is missing', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
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

    it('PUT /password-reset/:uuid password and passwordAgain are not the same', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
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

    it('PUT /password-reset/:uuid password too short', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
            .send({ password: '1234567', passwordAgain: '1234567' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        error: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('PUT /password-reset/:uuid password too short', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
            .send({
                password: '123456781234567812345678',
                passwordAgain: '123456781234567812345678',
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        error: expect.stringContaining(
                            'Validation error: Password must be between 8 and 20 characters'
                        ),
                    })
                );
            });
    });

    it('PUT /password-reset/:uuid everything went well', async () => {
        const user = await User.findOne({
            where: { email: 'test@test.com' },
        });
        const passwordReset = await user.getPasswordReset();
        const uuid = passwordReset.getUuid();
        return request(app)
            .put('/password-reset/' + uuid)
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
