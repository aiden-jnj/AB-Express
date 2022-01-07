const { existsSync, mkdirSync } = require('fs')
const { resolve } = require('path')
const split = require('split')
const winston = require('winston')
const winstonDaily = require('winston-daily-rotate-file')


/**
 * Create log format(`winston.Format`) using the passed options and return it.
 *
 * @private
 * @param {Object} [options=undefined] Options for creating logger.
 * @param {Boolean} [options.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [options.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Format} Log format created using passed options.
 */
const logFormat = options => {
  const { combine, printf, splat, timestamp } = winston.format
  let formats = []

  if (!options || (options && options.splat !== false)) {
    formats.push(splat())
  }

  let timeFormat = 'YYYY-MM-DD HH:mm:ss.SSSS'
  if (options && typeof options.timestamp === 'string') {
    timeFormat = options.timestamp
  }
  formats.push(timestamp({ format: timeFormat }))

  formats.push(printf(({ level, message, timestamp }) => {
    return `[${timestamp} ${level.toUpperCase()}] ${message}`
  }))

  return combine(...formats)
}

/**
 * Create log transports(`winston.Transport`) using the passed options and returns them.
 *
 * @private
 * @param {Object} [options=undefined] Options for creating loggers.
 * @param {String} [options.datePattern='YYYYMMDD'] Date pattern string to use for log file names.
 * @param {Number} [options.logLevel=3] Log level to output.
 * |Level|Method  |
 * |:----|:-------|
 * |0    |error   |
 * |1    |warn    |
 * |2    |info    |
 * |3    |http    |
 * |4    |verbose |
 * |5    |debug   |
 * |6    |silly   |
 * @param {String} [options.logPath=`${module.parent.parent.path}/logs`] Directory path to save log files.
 * @param {String} [options.maxFiles='90d'] Maximum days to keep log files.
 * @param {String} [options.maxSize='25m'] Maximum size of individual log files.
 * @param {Boolean} [options.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [options.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Transport[]} Log transports created using passed options.
 */
const logTransports = options => {
  const format = logFormat(options)
  const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
  let option = { format }

  let datePattern = 'YYYYMMDD'
  if (options && typeof options.datePattern === 'string') {
    datePattern = options.datePattern
  }
  option = { ...option, datePattern }

  let path = module.parent.path
  if (module.parent.parent && module.parent.parent.path) {
    path = module.parent.parent.path
  }
  let dirname = resolve(`${path}/logs`)
  if (options && typeof options.logPath === 'string') {
    if (options.logPath.indexOf('/') === 0) {
      dirname = resolve(`${options.logPath}`)
    } else {
      dirname = resolve(`${path}/${options.logPath}`)
    }
  }
  !existsSync(dirname) && mkdirSync(dirname)
  option = { ...option, dirname }

  let maxFiles = '90d'
  if (options && typeof options.maxFiles === 'string') {
    maxFiles = options.maxFiles
  }
  option = { ...option, maxFiles }

  let maxSize = '25m'
  if (options && typeof options.maxSize === 'string') {
    maxSize = options.maxSize
  }
  option = { ...option, maxSize }

  let level = 3
  if (options && !isNaN(options.logLevel)) {
    level = options.logLevel > 6 ? 6 : (options.logLevel < 0 ? 0 : options.logLevel)
  }

  let transports = []
  for (let i = 0; i <= level; i++) {
    transports.push(
      new winstonDaily({ ...option, filename: `%DATE%-${levels[i]}.log`, level: levels[i] })
    )
  }

  transports.push(new winston.transports.Console({ ...option, level: 'silly' }))

  return transports
}

/**
 * Create logger(`winston.Logger`) using the passed options and return it.
 *
 * @public
 * @param {Object} [options=undefined] Options for creating loggers.
 * @param {String} [options.datePattern='YYYYMMDD'] Date pattern string to use for log file names.
 * @param {Number} [options.logLevel=3] Log level to output.
 * |Level|Method  |
 * |:----|:-------|
 * |0    |error   |
 * |1    |warn    |
 * |2    |info    |
 * |3    |http    |
 * |4    |verbose |
 * |5    |debug   |
 * |6    |silly   |
 * @param {String} [options.logPath=`${module.parent.parent.path}/logs`] Directory path to save log files.
 * @param {String} [options.maxFiles='90d'] Maximum days to keep log files.
 * @param {String} [options.maxSize='25m'] Maximum size of individual log files.
 * @param {Boolean} [options.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [options.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Logger} Logger created using passed options.
 */
const createLogger = options => {
  const logger = winston.createLogger({ transports: logTransports(options) })
  logger.stream = split().on('data', message => { logger.http(message) })
  return logger
}


module.exports = { createLogger }
