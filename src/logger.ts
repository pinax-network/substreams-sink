import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'substreams-sink' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
