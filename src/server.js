const compression = require('compression')
const timeout = require('connect-timeout')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const http = require('http')
const morgan = require('morgan')


const { Router } = express

/**
 * Return port on which server will listen using passed options.
 * Port specified as environment variable takes precedence.
 * If port is not specified, 80 port is used.
 *
 * @private
 * @param {Object} [options=undefined] Options for creating server.
 * @param {Number|String} [options.port=80] Port on which server will listen.
 * @returns {Number|String} Port on which server will listen.
 */
const getPort = options => {
  let port = process && process.env && process.env.PORT
  port = port || options && options.port || 80
  port = parseInt(port, 10)
  return isNaN(port) || port >= 0 ? port : 80
}

/**
 * Set up created `express` server.
 *
 * @private
 * @param {Express} app Created `express` server.
 * @param {Object} [options=undefined] Options for creating server.
 * @param {Number|String} [options.port=80] Port on which server will listen.
 * @param {Boolean} [options.trustProxy=false] If you have node.js behind proxy, need to set `trust proxy` in `express`.
 * @param {String} [options.viewEngine='pug'] View engine to use in `express`.
 */
const setExpress = (app, options) => {
  app.set('port', getPort(options))
  app.set('trust proxy', options && options.trustProxy === true ? 1 : 0)
  app.set('view engine', options && options.viewEngine || 'pug')
}

/**
 * Set the modules to be used in the created `express` server.
 *
 * @private
 * @param {Express} app Created `express` server.
 * @param {Object} [options=undefined] Options for creating server.
 * @param {winston.Logger} [options.logger=undefined] Logger for log output with `winston`.
 * @param {express.Router} [options.router=undefined] Router instance object to use on `express` server.
 * @param {Object} [options.session=undefined] Options for `express` `session`.
 * @param {Object} [options.session.cookie=undefined] Settings object for the `session` ID cookie.
 * @param {String} [options.session.cookie.domain=undefined] Domain to which cookie will be applied.
 * By Default, no domain is set, and most clients will consider the cookie to apply to only current domain.
 * @param {Boolean} [options.session.cookie.httpOnly=true] Cookie allows to be sent only throuth HTTP(s), not client
 * JavaScript which can be protected from the Cross-Site Scripting(XSS) attack.
 * @param {Number} [options.session.cookie.maxAge=null] Specifies the number(in milliseconds) to use when calculating
 * expires attribute of cookie.
 * @param {String} [options.session.cookie.path='/'] Specifies value for path of cookie.
 * @param {Boolean} [options.session.cookie.secure=false] Specifies boolean value for secure attribute of cookie.
 * @param {Boolean} [options.session.resave=false] Forces the `session` to be saved back to the `session` store, even if
 * `session` was never modified during the `request`.
 * @param {Boolean} [options.session.saveUninitialized=true] Forces a `session` that is "uninitialized" to be saved
 * to store.
 * @param {String} [options.session.secret='^^#(^#!$'] Secret string used to sign `session` ID cookie.
 * @param {String} [options.static=undefined] Path for static files.
 * @param {Number|String} [options.timeout='5s'] Time(milliseconds) to use for request timeout.
 * Time can be specified as string allowed by th `ms` module.
 * @param {Boolean} [options.useCompression=true] Whether to enable `response` compression for `request`.
 * @param {Boolean} [options.useCookieParser=true] Whether to use `cookie-parser` library for `request` cookie parsing.
 * @param {Boolean} [options.useReqJSON=true] Whether to parse `request` into JSON format based on `body-parser`.
 * @param {Boolean} [options.useURLEncodeExtended=true] Whether to use URL query string data parsing as `qs` library.
 * If `true`, `qs` library that allows JSON nesting is used to analyze `reauest` query string.
 * If `false`, `querystring` library is used to analyze `reauest` query string.
 */
const useExpress = (app, options) => {
  if (!options || options.useCompression !== false) {
    app.use(compression())
  }
  if (!options || options.useCookieParser !== false) {
    app.use(cookieParser())
  }
  if (!options || options.useReqJSON !== false) {
    app.use(express.json())
  }
  if (!options || options.useURLEncodeExtended !== false) {
    app.use(express.urlencoded({ extended: true }))
  }

  if (options && options.logger && options.logger.stream) {
    app.use(morgan('combined', { stream: options.logger.stream }))
  } else {
    app.use(morgan('combined'))
  }

  const optSession = options && options.session || {}
  if (optSession.resave === undefined) optSession.resave = false
  if (optSession.saveUninitialized === undefined) optSession.saveUninitialized = true
  if (optSession.secret === undefined) optSession.secret = '^^#(^#!$'
  app.use(session(optSession))
  app.use(timeout(options && options.timeout || '5s'))

  if (options && options.router) {
    app.use('/', options.router)
  }
  if (options && options.static) {
    app.use(express.static(options.static))
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: options.static })
    })
  }
}

/**
 * Create `express` server using the passed options and return it.
 *
 * @public
 * @param {Object} [options=undefined] Options for creating server.
 * @param {winston.Logger} [options.logger=undefined] Logger for log output with `winston`.
 * @param {Number|String} [options.port=80] Port on which server will listen.
 * @param {express.Router} [options.router=undefined] Router instance object to use on `express` server.
 * @param {Object} [options.session=undefined] Options for `express` `session`.
 * @param {Object} [options.session.cookie=undefined] Settings object for the `session` ID cookie.
 * @param {String} [options.session.cookie.domain=undefined] Domain to which cookie will be applied.
 * By Default, no domain is set, and most clients will consider the cookie to apply to only current domain.
 * @param {Boolean} [options.session.cookie.httpOnly=true] Cookie allows to be sent only throuth HTTP(s), not client
 * JavaScript which can be protected from the Cross-Site Scripting(XSS) attack.
 * @param {Number} [options.session.cookie.maxAge=null] Specifies the number(in milliseconds) to use when calculating
 * expires attribute of cookie.
 * @param {String} [options.session.cookie.path='/'] Specifies value for path of cookie.
 * @param {Boolean} [options.session.cookie.secure=false] Specifies boolean value for secure attribute of cookie.
 * @param {Boolean} [options.session.resave=false] Forces the `session` to be saved back to the `session` store, even if
 * `session` was never modified during the `request`.
 * @param {Boolean} [options.session.saveUninitialized=true] Forces a `session` that is "uninitialized" to be saved
 * to store.
 * @param {String} [options.session.secret='^^#(^#!$'] Secret string used to sign `session` ID cookie.
 * @param {String} [options.static=undefined] Path for static files.
 * @param {Number|String} [options.timeout='5s'] Time(milliseconds) to use for request timeout.
 * Time can be specified as string allowed by th `ms` module.
 * @param {Boolean} [options.trustProxy=false] If you have node.js behind proxy, need to set `trust proxy` in `express`.
 * @param {Boolean} [options.useCompression=true] Whether to enable `response` compression for `request`.
 * @param {Boolean} [options.useCookieParser=true] Whether to use `cookie-parser` library for `request` cookie parsing.
 * @param {Boolean} [options.useReqJSON=true] Whether to parse `request` into JSON format based on `body-parser`.
 * @param {Boolean} [options.useURLEncodeExtended=true] Whether to use URL query string data parsing as `qs` library.
 * If `true`, `qs` library that allows JSON nesting is used to analyze `reauest` query string.
 * If `false`, `querystring` library is used to analyze `reauest` query string.
 * @param {String} [options.viewEngine='pug'] View engine to use in `express`.
 * @returns {Express} Express server created using passed options.
 */
const createServer = options => {
  const app = express()
  setExpress(app, options)
  useExpress(app, options)

  const logger = options && options.logger || console
  const server = http.createServer(app)
  const port = getPort(options)
  server.listen(port)

  server.on('error', error => {
    if (error.syscall !== 'listen') {
      error && error.message && logger.error && logger.error(`Server error: ${error.message}`)
      throw error
    }

    const bind = typeof port === 'string' ? `namepipe ${port}` : `${port} port`
    switch (error.code) {
      case 'EACCESS':
        logger.error && logger.error(`Server error: ${bind} requires elevated privileges.`)
        process.exit()
      case 'EADDRINUSE':
        logger.error && logger.error(`Server error: ${bind} is already in use.`)
        process.exit()
      default:
        error && error.message && logger.error && logger.error(`Server error: ${error.message}`)
        throw error
    }
  })

  server.on('listening', () => {
    const addr = server.address()
    const bind = typeof addr === 'string' ? `namepipe ${addr}` : `${addr.port} port`
    logger.info && logger.info(`Listening on ${bind}`)
    !logger.info && logger.log(`Listening on ${bind}`)
  })

  return app
}


module.exports = { createServer, Router }
