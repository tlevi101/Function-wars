const supertest = require('supertest');
const { app } = require('../app');
const request = supertest(app);
const { User, Report } = require('../../models');
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
const getUserTokens = async () => {
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
    );

    const userTokens = [];
    const USER_COUNT_IN_TEST_DB = await User.count({
        where: {
            email: { [Op.like]: 'user%' },
            role: 'user',
        },
    });
    const keys = [...Array(USER_COUNT_IN_TEST_DB).keys()];
    for await (const index of keys) {
        const response = await request
            .post('/login')
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
        .expect(201);

    const adminResponse = await request
        .post('/login')
        .send({
            email: 'admin0@functionWars.com',
            password: 'password',
        })
        .expect('Content-Type', /json/)
        .expect(200);
    return { userTokens, guestToken: response.body.jwt, badToken, adminToken: adminResponse.body.jwt };
};

describe('AdminController API tests when a guest making the request', () => {
    let guestToken, userTokens, badToken;

    beforeAll(async () => {
        ({ userTokens, guestToken, badToken } = await getUserTokens());
    });

    test('GET /admins - guest token', async () => {
        const response = await request
            .get('/admin/admins')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('GET /users - guest token', async () => {
        const response = await request
            .get('/admin/users')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/ban - guest token', async () => {
        const response = await request
            .put('/admin/users/1/ban')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);
        console.log(response.body);
        expect(response.body).toEqual({ message: 'You are not an admin!' });
    });

    test('PUT /users/:id/unban - guest token', async () => {
        const response = await request
            .put('/admin/users/1/unban')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/make-admin - guest token', async () => {
        const response = await request
            .put('/admin/users/1/make-admin')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/remove-admin - guest token', async () => {
        const response = await request
            .put('/admin/users/1/remove-admin')
            .set('Authorization', `Bearer ${guestToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('put /users/:id/add-remove-chat-restriction - guest token', async () => {
        const response = await request
            .put('/admin/users/1/add-remove-chat-restriction')
            .set('Authorization', `Bearer ${guestToken}`)
            .send({ chat_restriction: true })
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });
});

describe('AdminController API tests when a user making the request', () => {
    let guestToken, userTokens, badToken;

    beforeAll(async () => {
        ({ userTokens, guestToken, badToken } = await getUserTokens());
    });

    test('GET /admins - user token', async () => {
        const response = await request
            .get('/admin/admins')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('GET /users - user token', async () => {
        const response = await request
            .get('/admin/users')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/ban - user token', async () => {
        const response = await request
            .put('/admin/users/1/ban')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/unban - user token', async () => {
        const response = await request
            .put('/admin/users/1/unban')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/make-admin - user token', async () => {
        const response = await request
            .put('/admin/users/1/make-admin')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/remove-admin - user token', async () => {
        const response = await request
            .put('/admin/users/1/remove-admin')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });

    test('put /users/:id/add-remove-chat-restriction - user token', async () => {
        const response = await request
            .put('/admin/users/1/add-remove-chat-restriction')
            .set('Authorization', `Bearer ${userTokens[0]}`)
            .send({ chat_restriction: true })
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You are not an admin!' });
        expect(response.status).toBe(403);
    });
});

describe('AdminController.getAdmins() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('GET /admins - admin token', async () => {
        const response = await request
            .get('/admin/admins')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual(
            expect.objectContaining({
                admins: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        name: expect.any(String),
                        email: 'admin0@functionWars.com',
                        is_admin: true,
                        role: expect.stringMatching(/^(admin|super_admin)$/),
                    }),
                ]),
            })
        );

        expect(response.status).toBe(200);
    });
});

describe('AdminController.getUsers() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('GET /users - admin token', async () => {
        const response = await request
            .get('/admin/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual(
            expect.objectContaining({
                users: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        name: expect.any(String),
                        email: expect.any(String),
                        is_admin: false,
                        role: 'user',
                        banned: expect.any(Boolean),
                        banned_reason: expect.any(String),
                        chat_restriction: expect.any(Boolean),
                    }),
                ]),
            })
        );
        expect(response.status).toBe(200);
    });
});

describe('AdminController.banUser() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('PUT /users/:id/ban - target user not found', async () => {
        const response = await request
            .put('/admin/users/100/ban')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User not found.' });
        expect(response.status).toBe(404);
    });

    test('PUT /users/:id/ban - user found', async () => {
        const response = await request
            .put('/admin/users/5/ban')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);
        //TODO TEST SOCKET EVENT
        expect(response.body).toEqual({ message: 'User banned.' });
        expect(response.status).toBe(200);
        const user = await User.findByPk(5);
        expect(user.banned).toBe(true);
    });
});

describe('AdminController.unbanUser() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('PUT /users/:id/unban - target user not found', async () => {
        const response = await request
            .put('/admin/users/100/unban')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User not found.' });
        expect(response.status).toBe(404);
    });

    test('PUT /users/:id/unban - user found', async () => {
        const response = await request
            .put('/admin/users/5/unban')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User unbanned.' });
        expect(response.status).toBe(200);

        const user = await User.findByPk(5);
        expect(user.banned).toBe(false);
    });
});

describe('AdminController.makeAdmin() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('PUT /users/:id/make-admin - target user not found', async () => {
        const response = await request
            .put('/admin/users/100/make-admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User not found.' });
        expect(response.status).toBe(404);
    });

    test('PUT /users/:id/make-admin - user is super admin', async () => {
        const superAdmin = await User.findOne({ where: { role: 'super_admin' } });
        console.log(superAdmin?.toJSON());
        const response = await request
            .put(`/admin/users/${superAdmin.id}/make-admin`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You cannot change super admin.' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/make-admin - user found', async () => {
        const response = await request
            .put('/admin/users/5/make-admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User is now admin.' });
        expect(response.status).toBe(200);

        const user = await User.findByPk(5);
        expect(user.is_admin).toBe(true);
    });
});

describe('AdminController.removeAdmin() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('PUT /users/:id/remove-admin - target user not found', async () => {
        const response = await request
            .put('/admin/users/100/remove-admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User not found.' });
        expect(response.status).toBe(404);
    });

    test('PUT /users/:id/remove-admin - user is super admin', async () => {
        const superAdmin = await User.findOne({ where: { role: 'super_admin' } });
        const response = await request
            .put(`/admin/users/${superAdmin.id}/remove-admin`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'You cannot change super admin.' });
        expect(response.status).toBe(403);
    });

    test('PUT /users/:id/remove-admin - user found', async () => {
        const response = await request
            .put('/admin/users/5/remove-admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User is no longer admin.' });
        expect(response.status).toBe(200);
        const user = await User.findByPk(5);
        expect(user.is_admin).toBe(false);
    });
});

describe('AdminController.addOrRemoveChatRestriction() API tests', () => {
    let guestToken, userTokens, badToken, adminToken;
    beforeAll(async () => {
        ({ userTokens, guestToken, badToken, adminToken } = await getUserTokens());
    });

    test('PUT /users/:id/add-remove-chat-restriction - target user not found', async () => {
        const response = await request
            .put('/admin/users/100/add-remove-chat-restriction')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User not found.' });
        expect(response.status).toBe(404);
    });

    test('PUT /users/:id/add-remove-chat-restriction - user found', async () => {
        const response = await request
            .put('/admin/users/5/add-remove-chat-restriction')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: 'User is now chat restricted.' });
        expect(response.status).toBe(200);

        const user = await User.findByPk(5);
        expect(user.chat_restriction).toBe(true);
    });

    test('PUT /users/:id/add-remove-chat-restriction - user found', async () => {
        const response = await request
            .put('/admin/users/5/add-remove-chat-restriction')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/);

        expect(response.body).toEqual({ message: "User's chat restriction removed" });
        expect(response.status).toBe(200);

        const user = await User.findByPk(5);
        expect(user.chat_restriction).toBe(false);
    });

    test('GET /admin/reports', async ()=>{
        const response = await request
            .get('/admin/reports')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.reports).not.toBe(undefined);
    })

    test('DELETE /admin/reports/:id', async ()=>{
        let response = await request
            .delete(`/admin/reports/${1}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Report deleted.')
        let report = await Report.findByPk(1);
        expect(report.deletedAt).not.toBe(null);
        expect(report.handled).toBeTruthy();


        response = await request
            .delete(`/admin/reports/${1}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Report deleted.')

        report = await Report.findByPk(1);
        expect(report).toBe(null);

    })

    test('DELETE /admin/reports/:id error', async ()=>{
        const response = await request
            .delete(`/admin/reports/${10000}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Report not found.')
    })
});
