const { createLogger, createServer, Router } = require('ab-express')
const path = require('path')


// Configuration for Logger
const cfgLog = {
  datePattern: 'YYMMDD',
  logLevel: 6,
  logPath: path.join(__dirname, 'log'),
  maxFiles: '30d',
  maxSize: '12m',
  splat: true,
  timestamp: 'YY-MM-DD HH:mm:ss.SS'
}

// Configuration for Server
const cfgServer = {
  port: 3000,
  // Configuration for Session
  session: {
    // Configuration for Cookie
    cookie: {
      domain: 'localhost',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      secure: true
    },
    resave: false,
    saveUninitialized: true,
    secret: 'ExampleConfig-^^#(^#!$'
  },
  static: path.join(__dirname, 'static'),
  timeout: '5s',
  trustProxy: true,
  useCompression: true,
  useCookieParser: true,
  useReqJSON: true,
  useURLEncodeExtended: true,
  viewEngine: 'pug',
  views: path.join(__dirname, 'views')
}

// Router
const api = new Router()
api.get('/api', (req, res) => {
  res.render('index', { title: 'ABExpress example' })
})
const router = new Router()
router.use(api)

// Create Logger
const log = createLogger(cfgLog)
// Create Server
const app = createServer({ ...cfgServer, logger: log, router })
// `express` server listening on port 3000 is started.
