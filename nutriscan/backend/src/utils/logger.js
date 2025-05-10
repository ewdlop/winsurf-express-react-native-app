const winston = require('winston');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Define log levels with severity
const levels = {
  error: 0,
  warn: 1,
  security: 2,
  info: 3,
  http: 4,
  debug: 5,
  trace: 6
};

// Define log colors
const colors = {
  error: 'bold red',
  warn: 'yellow',
  security: 'magenta',
  info: 'green',
  http: 'cyan',
  debug: 'blue',
  trace: 'gray'
};

// Tell winston to use these colors
winston.addColors(colors);

// Custom log formatter with enhanced context
const enhancedLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ 
    level, 
    message, 
    timestamp, 
    stack, 
    ...metadata 
  }) => {
    const traceId = metadata.traceId || uuidv4();
    const hostname = os.hostname();
    const pid = process.pid;

    let logMessage = `${timestamp} [${traceId}] ${level.toUpperCase()}: ${message}`;
    
    // Include stack trace for errors
    if (stack) {
      logMessage += `
${stack}`;
    }

    // Include additional metadata
    if (Object.keys(metadata).length > 0) {
      logMessage += `
METADATA: ${JSON.stringify(metadata, null, 2)}`;
    }

    return logMessage;
  })
);

// Create transports for different log outputs
const transports = [
  // Console transport with color and enhanced formatting
  new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      enhancedLogFormat
    )
  }),
  
  // Error log transport (JSON format for structured logging)
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Security log transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/security.log'),
    level: 'security',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Combined log transport
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
});

// Custom error logging method
logger.logError = (err, additionalInfo = {}) => {
  const errorLog = {
    message: err.message,
    stack: err.stack,
    ...additionalInfo,
  };

  logger.error(JSON.stringify(errorLog));
};

module.exports = logger;
