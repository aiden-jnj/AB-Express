const { createLogger, createServer } = require('ab-express')


const log = createLogger()
const app = createServer({ logger: log })


module.exports = app
