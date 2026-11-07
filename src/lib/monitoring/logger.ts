/**
 * Structured Observability & Error Monitoring Logger
 * Wraps Sentry and structured console reporting for server & browser contexts.
 */

export interface LogContext {
  storeId?: string;
  userId?: string;
  path?: string;
  [key: string]: any;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ level: "info", timestamp, message, ...context }));
  },

  warn: (message: string, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({ level: "warn", timestamp, message, ...context }));
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    const errorDetails =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { error };

    console.error(
      JSON.stringify({
        level: "error",
        timestamp,
        message,
        ...errorDetails,
        ...context,
      })
    );
  },
};
