const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const jsonwebtoken = require('jsonwebtoken');
const Client = require('socket.io-client');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const chalk = require('chalk');
const { CustomGameController } = require('../types/controllers/CustomGameController');
const { v4: uuidv4 } = require('uuid');
const signToken = json => {
    return jsonwebtoken.sign(json, process.env.JWT_SECRET || 'secret', {
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
    });
};
describe('test fields controller', () => {
    let guestToken;
    let users;
    const userTokens = [];
    beforeAll(async () => {
        users = await User.findAll({
            where: {
                role: 'user',
            },
        });
        for await (const user of users) {
            const token = signToken(user.toJSONForJWT());
            userTokens.push(token);
        }
        guestToken = signToken({
            type: 'guest',
            name: `Guest: test guest`,
            guest: true,
            JWT_createdAt: new Date(),
            id: uuidv4(),
        });
    }, 10 * 1000);

    describe('guest makes a request', () => {
        const testCases = [
            { method: 'get', route: '/fields', code: 403, msg: 'Guest cannot make this request!' },
            { method: 'get', route: '/fields/1', code: 403, msg: 'Guest cannot make this request!' },
            { method: 'get', route: '/fields/1/show', code: 200, msg: undefined },
            { method: 'post', route: '/fields', code: 403, msg: 'Guest cannot make this request!' },
            { method: 'put', route: '/fields/1', code: 403, msg: 'Guest cannot make this request!' },
            { method: 'delete', route: '/fields/1', code: 403, msg: 'Guest cannot make this request!' },
            { method: 'put', route: '/fields/1/restore', code: 403, msg: 'Guest cannot make this request!' },
        ];
        test.each(testCases)('test $method $route', async ({ method, route, code, msg }) => {
            let response;
            if (method === 'get') {
                response = await request.get(route).set('Authorization', `Bearer ${guestToken}`);
            }
            if (method === 'put') {
                response = await request.put(route).set('Authorization', `Bearer ${guestToken}`);
            }
            if (method === 'delete') {
                response = await request.delete(route).set('Authorization', `Bearer ${guestToken}`);
            }
            if (method === 'post') {
                response = await request.post(route).set('Authorization', `Bearer ${guestToken}`);
            }
            expect(response.status).toBe(code);
            if (msg) {
                expect(response.body.message).toBe(msg);
            }
        });
    });

    describe('get requests test', () => {
        let field;
        beforeAll(async () => {
            let fields = await users[0].getFields();
            field = fields[0];
        });

        test('GET /fields', async () => {
            const response = await request.get('/fields').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            const usersFields = await users[0].getFields();
            expect(response.body.fields.length).toBe(usersFields.length);
            response.body.fields.forEach((receivedField, index) => {
                console.debug(receivedField);
                compareObjectRecursively(receivedField, usersFields[index]);
            });
        });

        test('GET /fields/1 ERROR', async () => {
            const response = await request.get('/fields/1').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Access denied.');
        });
        test('GET /fields/1000 ERROR', async () => {
            const response = await request.get('/fields/1000').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Field not found.');
        });

        test(`GET /fields/:id user's first field`, async () => {
            const response = await request.get(`/fields/${field.id}`).set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            compareObjectRecursively(response.body.field, field);
        });

        test('GET /fields/1/show', async () => {
            const response = await request.get('/fields/1/show').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            const adminField = await Field.findByPk(1);
            compareObjectRecursively(response.body.field, adminField);
        });
    });

    describe('post requests', () => {
        let field;
        beforeAll(async () => {
            let fields = await users[0].getFields();
            field = fields[0];
        });

        test('invalid field', async () => {
            let newFieldJSON = newField();
            newFieldJSON.name = undefined;
            const response = await request
                .post('/fields')
                .send(newFieldJSON)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid field.');
        });

        test('valid field', async () => {
            let newFieldJSON = newField();
            const response = await request
                .post('/fields')
                .send(newFieldJSON)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(201);
            const createdField = await Field.findByPk(response.body.field.id);
            compareObjectRecursively(newFieldJSON, createdField);
        });
    });
    describe('delete request', () => {
        let field;
        beforeAll(async () => {
            let fields = await users[0].getFields();
            field = fields[1];
        });

        test('field not found', async () => {
            const response = await request.delete('/fields/1000').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Field not found.');
        });

        test('access denied', async () => {
            const response = await request.delete('/fields/1').set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Access denied.');
        });
        test('soft delete', async () => {
            const response = await request
                .delete(`/fields/${field.id}`)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Field deleted.');
            const deletedField = await Field.findByPk(field.id);
            expect(deletedField.deletedAt).not.toBe(null);
        });

        test('hard delete', async () => {
            const response = await request
                .delete(`/fields/${field.id}`)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Field deleted.');
            const deletedField = await Field.findByPk(field.id);
            expect(deletedField).toBe(null);
        });
    });

    describe('update field', () => {
        let field;
        beforeAll(async () => {
            let fields = await users[0].getFields();
            field = fields[0];
        });

        test('PUT /fields/1000', async () => {
            const edited = editedField();
            const response = await request
                .put(`/fields/1000`)
                .send(edited)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Field not found.');
        });

        test('PUT /fields/:id ERROR', async () => {
            let edited = editedField();
            edited.name = undefined;
            const response = await request
                .put(`/fields/${field.id}`)
                .send(edited)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid field.');
        });

        test('PUT /fields/1 access denied', async () => {
            let edited = editedField();
            const response = await request
                .put(`/fields/1`)
                .send(edited)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Access denied.');
        });

        test('PUT /fields/:id success', async () => {
            let edited = editedField();
            const response = await request
                .put(`/fields/${field.id}`)
                .send(edited)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            compareObjectRecursively(edited, response.body.field);
            const afterEdit = await Field.findByPk(field.id);
            compareObjectRecursively(edited, afterEdit);
        });

        describe('restore field', () => {
            beforeAll(async () => {
                await field.update({ deletedAt: new Date() });
            });
            test('PUT /fields/1000/restore', async () => {
                const response = await request
                    .put(`/fields/1000/restore`)
                    .set('Authorization', `Bearer ${userTokens[0]}`);
                expect(response.status).toBe(404);
                expect(response.body.message).toBe('Field not found.');
            });

            test('PUT /fields/1/restore', async () => {
                const response = await request.put(`/fields/1/restore`).set('Authorization', `Bearer ${userTokens[0]}`);
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('Access denied.');
            });

            test('PUT /fields/:id/restore', async () => {
                const response = await request
                    .put(`/fields/${field.id}/restore`)
                    .set('Authorization', `Bearer ${userTokens[0]}`);
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Field restored.');
                const restored = await Field.findByPk(field.id);
                expect(restored.deletedAt).toBe(null);
            });
        });
    });
});

function compareObjectRecursively(receivedObject, expectedObject) {
    for (let key of Object.keys(receivedObject)) {
        if (typeof receivedObject[key] === 'object' && receivedObject[key] !== null) {
            compareObjectRecursively(receivedObject[key], expectedObject[key]);
        } else {
            if (expectedObject[key] instanceof Date) {
                expect(new Date(receivedObject[key]).toString()).toBe(expectedObject[key].toString());
            } else {
                expect(receivedObject[key]).toBe(expectedObject[key]);
            }
        }
    }
}
function newField() {
    return {
        name: 'test field2',
        field: {
            objects: [
                {
                    type: 'Rectangle',
                    location: { x: 300, y: 512 },
                    avoidArea: { radius: 105, location: { x: 300, y: 512 } },
                    dimension: { width: 200, height: 200 },
                },
                {
                    type: 'Ellipse',
                    location: { x: 500, y: 210 },
                    avoidArea: { radius: 105, location: { x: 500, y: 210 } },
                    dimension: { width: 200, height: 200 },
                },
            ],
            players: [
                {
                    location: { x: 210, y: 210 },
                    avoidArea: { radius: 130, location: { x: 210, y: 210 } },
                    dimension: { width: 40, height: 40 },
                },
                {
                    location: { x: 700, y: 525 },
                    avoidArea: { radius: 130, location: { x: 700, y: 525 } },
                    dimension: { width: 40, height: 40 },
                },
            ],
            dimension: { width: 1000, height: 700 },
        },
    };
}

function editedField() {
    return {
        name: 'edited',
        field: {
            objects: [
                {
                    type: 'Rectangle',
                    location: { x: 300, y: 512 },
                    avoidArea: { radius: 105, location: { x: 300, y: 512 } },
                    dimension: { width: 200, height: 200 },
                },
                {
                    type: 'Ellipse',
                    location: { x: 500, y: 210 },
                    avoidArea: { radius: 105, location: { x: 500, y: 210 } },
                    dimension: { width: 200, height: 200 },
                },
                {
                    type: 'Ellipse',
                    location: { x: 500, y: 500 },
                    avoidArea: { radius: 105, location: { x: 500, y: 500 } },
                    dimension: { width: 100, height: 100 },
                },
            ],
            players: [
                {
                    location: { x: 150, y: 210 },
                    avoidArea: { radius: 130, location: { x: 210, y: 210 } },
                    dimension: { width: 40, height: 40 },
                },
                {
                    location: { x: 700, y: 525 },
                    avoidArea: { radius: 130, location: { x: 700, y: 525 } },
                    dimension: { width: 40, height: 40 },
                },
            ],
            dimension: { width: 1000, height: 700 },
        },
    };
}
