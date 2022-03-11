const compression = require('compression')
const timeout = require('connect-timeout')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const http = require('http')
const createError = require('http-errors')
const morgan = require('morgan')
const { resolve } = require('path')


const { Router } = express
const logLabel = '[AB-Express] '

/**
 * Returns application root directory path.
 *
 * @private
 * @returns {String} Application root directory path.
 */
const getBasePath = () => {
  let path = module?.parent?.path
  if (module?.parent?.parent?.path) {
    path = module.parent.parent.path
  }
  return path
}

/**
 * Return port on which server will listen using passed configuration.
 * Port specified as environment variable takes precedence.
 * If port is not specified, 80 port is used.
 *
 * @private
 * @param {Object} [config=undefined] Options for creating server.
 * @param {Number|String} [config.port=80] Port on which server will listen.
 * @returns {Number|String} Port on which server will listen.
 */
const getPort = config => {
  let port = process?.env?.PORT
  port = port || config?.port || 80
  port = parseInt(port, 10)
  return isNaN(port) || port >= 0 ? port : 80
}

/**
 * Set up created `express` server.
 *
 * @private
 * @param {Express} app Created `express` server.
 * @param {Object} [config=undefined] Options for creating server.
 * @param {Number|String} [config.port=80] Port on which server will listen.
 * @param {Boolean} [config.trustProxy=false] If you have node.js behind proxy, need to set `trust proxy` in `express`.
 * @param {String} [config.viewEngine='pug'] View engine to use in `express`.
 * @param {String|Array} [config.views='views'] Path where view pages to be used by `express` server are located.
 */
const setExpress = (app, config) => {
  const logger = config?.logger || console

  const port = getPort(config)
  app.set('port', port)
  logger.info(logLabel + 'set port\t\t: ' + port)

  const trustProxy = config?.trustProxy === true ? 1 : 0
  app.set('trust proxy', trustProxy)
  logger.info(logLabel + 'set trust proxy\t: ' + trustProxy)

  const viewEngine = config?.viewEngine || 'pug'
  app.set('view engine', viewEngine)
  logger.info(logLabel + 'set view engine\t: ' + viewEngine)

  const views = config?.views || resolve(`${getBasePath()}/views`)
  app.set('views', views)
  logger.info(logLabel + 'set views\t\t: ' + views + '\n')
}

/**
 * Set the modules to be used in the created `express` server.
 *
 * @private
 * @param {Express} app Created `express` server.
 * @param {Object} [config=undefined] Options for creating server.
 * @param {Boolean} [ignore404=false] Whether to ignore 404(Not Found) errors and use static pages.
 * @param {winston.Logger} [config.logger=undefined] Logger for log output with `winston`.
 * @param {express.Router} [config.router=undefined] Router instance object to use on `express` server.
 * @param {Object} [config.session=undefined] Options for `express` `session`.
 * @param {Object} [config.session.cookie=undefined] Settings object for the `session` ID cookie.
 * @param {String} [config.session.cookie.domain=undefined] Domain to which cookie will be applied.
 * By Default, no domain is set, and most clients will consider the cookie to apply to only current domain.
 * @param {Boolean} [config.session.cookie.httpOnly=true] Cookie allows to be sent only throuth HTTP(s), not client
 * JavaScript which can be protected from the Cross-Site Scripting(XSS) attack.
 * @param {Number} [config.session.cookie.maxAge=null] Specifies the number(in milliseconds) to use when calculating
 * expires attribute of cookie.
 * @param {String} [config.session.cookie.path='/'] Specifies value for path of cookie.
 * @param {Boolean} [config.session.cookie.secure=false] Specifies boolean value for secure attribute of cookie.
 * @param {Boolean} [config.session.resave=false] Forces the `session` to be saved back to the `session` store, even if
 * `session` was never modified during the `request`.
 * @param {Boolean} [config.session.saveUninitialized=true] Forces a `session` that is "uninitialized" to be saved
 * to store.
 * @param {String} [config.session.secret='^^#(^#!$'] Secret string used to sign `session` ID cookie.
 * @param {String} [config.static='<root>/static'] Path for static files.
 * @param {Number|String} [config.timeout='5s'] Time(milliseconds) to use for request timeout.
 * Time can be specified as string allowed by th `ms` module.
 * @param {Boolean} [config.useCompression=true] Whether to enable `response` compression for `request`.
 * @param {Boolean} [config.useCookieParser=true] Whether to use `cookie-parser` library for `request` cookie parsing.
 * @param {Boolean} [config.useReqJSON=true] Whether to parse `request` into JSON format based on `body-parser`.
 * @param {Boolean} [config.useURLEncodeExtended=true] Whether to use URL query string data parsing as `qs` library.
 * If `true`, `qs` library that allows JSON nesting is used to analyze `reauest` query string.
 * If `false`, `querystring` library is used to analyze `reauest` query string.
 */
const useExpress = (app, config) => {
  const logger = config?.logger || console

  if (!config || config?.useCompression !== false) {
    app.use(compression())
    logger.info(logLabel + 'use compression')
  }
  if (!config || config?.useCookieParser !== false) {
    app.use(cookieParser())
    logger.info(logLabel + 'use cookieParser')
  }
  if (!config || config?.useReqJSON !== false) {
    app.use(express.json())
    logger.info(logLabel + 'use express.json')
  }
  if (!config || config?.useURLEncodeExtended !== false) {
    app.use(express.urlencoded({ extended: true }))
    logger.info(logLabel + 'use express.urlencoded')
  }

  if (config?.logger?.stream) {
    app.use(morgan('combined', { stream: config.logger.stream }))
    logger.info(logLabel + 'use morgan with stream')
  } else {
    app.use(morgan('combined'))
    logger.info(logLabel + 'use morgan')
  }

  const optSession = config?.session || {}
  if (optSession.resave === undefined) optSession.resave = false
  if (optSession.saveUninitialized === undefined) optSession.saveUninitialized = true
  if (optSession.secret === undefined) optSession.secret = '^#!$-&#@!'
  app.use(session(optSession))
  logger.info(logLabel + 'use session\t: %o', optSession)

  const timeOut = config?.timeout || '5s'
  app.use(timeout(timeOut))
  logger.info(logLabel + 'use timeout\t: ' + timeOut)

  if (config?.router) {
    app.use('/', config.router)
    logger.info(logLabel + 'use router\t\t: %o', config.router)
  }

  const static = config?.static || resolve(`${getBasePath()}/static`)
  app.use(express.static(static))
  logger.info(logLabel + 'use static\t\t: %o\n', static)

  if (config?.ignore404) {
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: static })
    })
    logger.info(logLabel + 'ignore 404\n')
  }

  app.use((req, res, next) => { next(createError(404)) })
  app.use((err, req, res, next) => {
    logger.error('%o', err)

    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    res.status(err.status || 500)
    res.render('error')
  })
}

/**
 * Create `express` server using the passed configuration and return it.
 *
 * @public
 * @param {Object} [config=undefined] Options for creating server.
 * @param {Boolean} [ignore404=false] Whether to ignore 404(Not Found) errors and use static pages.
 * @param {winston.Logger} [config.logger=undefined] Logger for log output with `winston`.
 * @param {Number|String} [config.port=80] Port on which server will listen.
 * @param {express.Router} [config.router=undefined] Router instance object to use on `express` server.
 * @param {Object} [config.session=undefined] Options for `express` `session`.
 * @param {Object} [config.session.cookie=undefined] Settings object for the `session` ID cookie.
 * @param {String} [config.session.cookie.domain=undefined] Domain to which cookie will be applied.
 * By Default, no domain is set, and most clients will consider the cookie to apply to only current domain.
 * @param {Boolean} [config.session.cookie.httpOnly=true] Cookie allows to be sent only throuth HTTP(s), not client
 * JavaScript which can be protected from the Cross-Site Scripting(XSS) attack.
 * @param {Number} [config.session.cookie.maxAge=null] Specifies the number(in milliseconds) to use when calculating
 * expires attribute of cookie.
 * @param {String} [config.session.cookie.path='/'] Specifies value for path of cookie.
 * @param {Boolean} [config.session.cookie.secure=false] Specifies boolean value for secure attribute of cookie.
 * @param {Boolean} [config.session.resave=false] Forces the `session` to be saved back to the `session` store, even if
 * `session` was never modified during the `request`.
 * @param {Boolean} [config.session.saveUninitialized=true] Forces a `session` that is "uninitialized" to be saved
 * to store.
 * @param {String} [config.session.secret='^^#(^#!$'] Secret string used to sign `session` ID cookie.
 * @param {String} [config.static='<root>/static'] Path for static files.
 * @param {Number|String} [config.timeout='5s'] Time(milliseconds) to use for request timeout.
 * Time can be specified as string allowed by th `ms` module.
 * @param {Boolean} [config.trustProxy=false] If you have node.js behind proxy, need to set `trust proxy` in `express`.
 * @param {Boolean} [config.useCompression=true] Whether to enable `response` compression for `request`.
 * @param {Boolean} [config.useCookieParser=true] Whether to use `cookie-parser` library for `request` cookie parsing.
 * @param {Boolean} [config.useReqJSON=true] Whether to parse `request` into JSON format based on `body-parser`.
 * @param {Boolean} [config.useURLEncodeExtended=true] Whether to use URL query string data parsing as `qs` library.
 * If `true`, `qs` library that allows JSON nesting is used to analyze `reauest` query string.
 * If `false`, `querystring` library is used to analyze `reauest` query string.
 * @param {String} [config.viewEngine='pug'] View engine to use in `express`.
 * @param {String|Array} [config.views='views'] Path where view pages to be used by `express` server are located.
 * @returns {Express} Express server created using passed configuration.
 */
const createServer = config => {
  const app = express()
  setExpress(app, config)
  useExpress(app, config)

  const logger = config?.logger || console
  const server = http.createServer(app)
  const port = getPort(config)
  server.listen(port)

  server.on('error', error => {
    if (error?.syscall !== 'listen') {
      logger.error(logLabel + `Server error: ${error.message}`)
      logger.error(logLabel + 'Server error: %o', error)
      throw error
    }

    const bind = typeof port === 'string' ? `namepipe ${port}` : `${port} port`
    switch (error?.code) {
      case 'EACCESS':
        logger.error(logLabel + `Server error: ${bind} requires elevated privileges.`)
        process.exit()
      case 'EADDRINUSE':
        logger.error(logLabel + `Server error: ${bind} is already in use.`)
        process.exit()
      default:
        logger.error(logLabel + `Server error: ${error.message}`)
        logger.error(logLabel + 'Server error: %o', error)
        throw error
    }
  })

  server.on('listening', () => {
    const addr = server.address()
    const bind = typeof addr === 'string' ? `namepipe ${addr}` : `${addr.port} port`
    logger.info(logLabel + `Listening on ${bind}\n`)
  })

  return app
}


module.exports = { createServer, Router }
