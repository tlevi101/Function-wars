// //disable every console methods for testing
const { overrideConsole } = require('nodejs-better-console');
overrideConsole();
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
console.info = jest.fn();
console.debug = jest.fn();
