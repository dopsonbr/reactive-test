type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  url?: string;
  sessionId?: string;
  kioskId?: string;
  transactionId?: string;
}

class Logger {
  private context: Record<string, unknown> = {};

  setContext(ctx: Record<string, unknown>) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...data },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.context.sessionId as string | undefined,
      kioskId: this.context.kioskId as string | undefined,
      transactionId: this.context.transactionId as string | undefined,
    };

    if (import.meta.env.DEV) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}]`, message, entry.context);
    }

    // In production, could send to logging endpoint
    // this.sendToEndpoint(entry);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    this.log('error', message, {
      ...data,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
