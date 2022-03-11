const { existsSync, mkdirSync } = require('fs')
const { resolve } = require('path')
const split = require('split')
const winston = require('winston')
const winstonDaily = require('winston-daily-rotate-file')


const logLabel = '[AB-Express] '

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

  if (!config || (config?.splat !== false)) {
    formats.push(splat())
    console.info(logLabel + 'use splat in log format')
  }

  let timeFormat = 'YYYY-MM-DD HH:mm:ss.SSSS'
  if (config?.timestamp?.constructor.name === 'String') {
    timeFormat = config.timestamp
  }
  formats.push(timestamp({ format: timeFormat }))
  console.info(logLabel + 'log time format\t: %o', timeFormat)

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
  if (config?.datePattern?.constructor.name === 'String') {
    datePattern = config.datePattern
  }
  console.info(logLabel + 'date pattern\t: %o', datePattern)
  option = { ...option, datePattern }

  let path = module?.parent?.path
  if (module?.parent?.parent?.path) {
    path = module.parent.parent.path
  }
  let dirname = resolve(`${path}/logs`)
  if (config?.logPath?.constructor.name === 'String') {
    if (config.logPath.indexOf('/') === 0) {
      dirname = resolve(`${config.logPath}`)
    } else {
      dirname = resolve(`${path}/${config.logPath}`)
    }
  }
  console.info(logLabel + 'log path\t\t: %o', dirname)
  !existsSync(dirname) && mkdirSync(dirname)
  option = { ...option, dirname }

  let maxFiles = '90d'
  if (config?.maxFiles?.constructor.name === 'String') {
    maxFiles = config.maxFiles
  }
  console.info(logLabel + 'log max files\t: %o', maxFiles)
  option = { ...option, maxFiles }

  let maxSize = '25m'
  if (config?.maxSize?.constructor.name === 'String') {
    maxSize = config.maxSize
  }
  console.info(logLabel + 'log max size\t: %o', maxSize)
  option = { ...option, maxSize }

  let level = 3
  if (!isNaN(config?.logLevel)) {
    level = config.logLevel > 6 ? 6 : (config.logLevel < 0 ? 0 : config.logLevel)
  }
  console.info(logLabel + 'log level\t\t: %o\n', maxSize)

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
