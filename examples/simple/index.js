const { createLogger, createServer } = require('ab-express')


const log = createLogger()
const app = createServer({ logger: log })
// `express` server listening on port 80 is started.
