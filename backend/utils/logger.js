/**
 * @file logger.js
 * @description Structured application logger (Winston).
 */
import winston from 'winston';
import { authConfig } from '../config/auth.config.js';

const { combine, timestamp, json, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${message}${extra}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'task-management-api' },
  transports: [
    new winston.transports.Console({
      format: authConfig.isProduction
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp(), devFormat),
    }),
  ],
});
