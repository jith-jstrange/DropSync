import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    printf(({ level, message, timestamp, ...meta }) => {
      return `${timestamp as string} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), printf(({ level, message, timestamp, ...meta }) => `${timestamp as string} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`)),
    }),
  ],
});
