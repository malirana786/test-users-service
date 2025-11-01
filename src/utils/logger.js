import winston from "winston";

const { combine, timestamp, printf, json } = winston.format;

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.Console()
    ]
});

// Helper
export function bindLogContext(context = {}) {
    return {
        info: (msg, meta = {}) => logger.info({ msg, ...context, ...meta }),
        error: (msg, meta = {}) => logger.error({ msg, ...context, ...meta }),
        warn: (msg, meta = {}) => logger.warn({ msg, ...context, ...meta })
    };
}
