const express = require('express')


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
 * @param {Boolean} [options.trustProxy=false] If you have node.js behind proxy,
 *  need to set `trust proxy` in `express`.
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
 */
const useExpress = (app, options) => {
  app.use(express.urlencoded({ extended: true }))
}

/**
 * Create `express` server using the passed options and return it.
 *
 * @public
 * @param {Object} [options=undefined] Options for creating server.
 * @returns {Express} Express server created using passed options.
 */
const createServer = options => {
  const app = express()
  setExpress(app, options)
  useExpress(app, options)

  return app
}


module.exports = { createServer, express, Router }
