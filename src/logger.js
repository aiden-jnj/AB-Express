const { existsSync, mkdirSync } = require('fs')
const { resolve } = require('path')
const split = require('split')
const winston = require('winston')
const winstonDaily = require('winston-daily-rotate-file')


/**
 * Create log format(`winston.Format`) using the passed configuration and return it.
 *
 * @private
 * @param {Object} [config=undefined] Options for creating logger.
 * @param {Boolean} [config.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [config.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Format} Log format created using passed configuration.
 */
const logFormat = config => {
  const { combine, printf, splat, timestamp } = winston.format
  let formats = []

  if (!config || (config && config.splat !== false)) {
    formats.push(splat())
  }

  let timeFormat = 'YYYY-MM-DD HH:mm:ss.SSSS'
  if (config && typeof config.timestamp === 'string') {
    timeFormat = config.timestamp
  }
  formats.push(timestamp({ format: timeFormat }))

  formats.push(printf(({ level, message, timestamp }) => {
    return `[${timestamp} ${level.toUpperCase()}] ${message}`
  }))

  return combine(...formats)
}

/**
 * Create log transports(`winston.Transport`) using the passed configuration and returns them.
 *
 * @private
 * @param {Object} [config=undefined] Options for creating loggers.
 * @param {String} [config.datePattern='YYYYMMDD'] Date pattern string to use for log file names.
 * @param {Number} [config.logLevel=3] Log level to output.
 * |Level|Method  |
 * |:----|:-------|
 * |0    |error   |
 * |1    |warn    |
 * |2    |info    |
 * |3    |http    |
 * |4    |verbose |
 * |5    |debug   |
 * |6    |silly   |
 * @param {String} [config.logPath=`${module.parent.parent.path}/logs`] Directory path to save log files.
 * @param {String} [config.maxFiles='90d'] Maximum days to keep log files.
 * @param {String} [config.maxSize='25m'] Maximum size of individual log files.
 * @param {Boolean} [config.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [config.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Transport[]} Log transports created using passed configuration.
 */
const logTransports = config => {
  const format = logFormat(config)
  const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
  let option = { format }

  let datePattern = 'YYYYMMDD'
  if (config && typeof config.datePattern === 'string') {
    datePattern = config.datePattern
  }
  option = { ...option, datePattern }

  let path = module.parent.path
  if (module.parent.parent && module.parent.parent.path) {
    path = module.parent.parent.path
  }
  let dirname = resolve(`${path}/logs`)
  if (config && typeof config.logPath === 'string') {
    if (config.logPath.indexOf('/') === 0) {
      dirname = resolve(`${config.logPath}`)
    } else {
      dirname = resolve(`${path}/${config.logPath}`)
    }
  }
  !existsSync(dirname) && mkdirSync(dirname)
  option = { ...option, dirname }

  let maxFiles = '90d'
  if (config && typeof config.maxFiles === 'string') {
    maxFiles = config.maxFiles
  }
  option = { ...option, maxFiles }

  let maxSize = '25m'
  if (config && typeof config.maxSize === 'string') {
    maxSize = config.maxSize
  }
  option = { ...option, maxSize }

  let level = 3
  if (config && !isNaN(config.logLevel)) {
    level = config.logLevel > 6 ? 6 : (config.logLevel < 0 ? 0 : config.logLevel)
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
 * Create logger(`winston.Logger`) using the passed configuration and return it.
 *
 * @public
 * @param {Object} [config=undefined] Options for creating loggers.
 * @param {String} [config.datePattern='YYYYMMDD'] Date pattern string to use for log file names.
 * @param {Number} [config.logLevel=3] Log level to output.
 * |Level|Method  |
 * |:----|:-------|
 * |0    |error   |
 * |1    |warn    |
 * |2    |info    |
 * |3    |http    |
 * |4    |verbose |
 * |5    |debug   |
 * |6    |silly   |
 * @param {String} [config.logPath=`${module.parent.parent.path}/logs`] Directory path to save log files.
 * @param {String} [config.maxFiles='90d'] Maximum days to keep log files.
 * @param {String} [config.maxSize='25m'] Maximum size of individual log files.
 * @param {Boolean} [config.splat=true] Whether to use string interpolation splat for style messages('%d', '%s').
 * @param {String} [config.timestamp='YYYY-MM-DD HH:mm:ss.SSSS'] Timestamp format to use when outputing time the
 * message was received.
 * @returns {winston.Logger} Logger created using passed configuration.
 */
const createLogger = config => {
  const logger = winston.createLogger({ transports: logTransports(config) })
  logger.stream = split().on('data', message => { logger.http(message) })
  return logger
}


module.exports = { createLogger }