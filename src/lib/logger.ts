/**
 * Logger estruturado para produção.
 * Permite monitorar eventos, performance e erros de forma padronizada.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static format(level: LogLevel, message: string, context?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...context,
    };

    // Em produção (Vercel/Cloud), logs JSON são parseados automaticamente
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, context?: LogContext) {
    this.format('info', message, context);
  }

  static warn(message: string, context?: LogContext) {
    this.format('warn', message, context);
  }

  static error(message: string, error?: any, context?: LogContext) {
    this.format('error', message, {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
    });
  }

  static debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.format('debug', message, context);
    }
  }

  /**
   * Helper para medir tempo de execução de operações críticas (IA, DB).
   */
  static async trace<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`${label} - Success`, { ...context, duration_ms: Math.round(duration) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} - Failed`, error, { ...context, duration_ms: Math.round(duration) });
      throw error;
    }
  }
}

export { Logger };
