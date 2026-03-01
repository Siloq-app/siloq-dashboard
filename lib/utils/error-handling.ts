// Enhanced error types and handling utilities

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  ABORT = 'ABORT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
  timestamp: number;
  retryable: boolean;
  userMessage?: string;
}

export class ApplicationError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly retryable: boolean;
  public readonly userMessage?: string;
  public readonly originalError?: Error | unknown;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options: {
      context?: Record<string, unknown>;
      retryable?: boolean;
      userMessage?: string;
      originalError?: Error | unknown;
    } = {}
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.severity = severity;
    this.context = options.context;
    this.timestamp = Date.now();
    this.retryable = options.retryable ?? false;
    this.userMessage = options.userMessage;
    this.originalError = options.originalError;
    
    // Preserve original error stack
    if (options.originalError instanceof Error) {
      this.stack = options.originalError.stack;
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      originalError: this.originalError,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      userMessage: this.userMessage,
    };
  }

  static fromError(error: unknown, context?: Record<string, unknown>): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof Error) {
      // Determine error type based on error name or message
      let type = ErrorType.UNKNOWN;
      let severity = ErrorSeverity.MEDIUM;
      let retryable = false;

      if (error.name === 'AbortError') {
        type = ErrorType.ABORT;
        severity = ErrorSeverity.LOW;
        retryable = false;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        type = ErrorType.NETWORK;
        severity = ErrorSeverity.HIGH;
        retryable = true;
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        type = ErrorType.AUTHENTICATION;
        severity = ErrorSeverity.HIGH;
        retryable = false;
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        type = ErrorType.AUTHORIZATION;
        severity = ErrorSeverity.HIGH;
        retryable = false;
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        type = ErrorType.NOT_FOUND;
        severity = ErrorSeverity.MEDIUM;
        retryable = false;
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        type = ErrorType.SERVER_ERROR;
        severity = ErrorSeverity.HIGH;
        retryable = true;
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        type = ErrorType.TIMEOUT;
        severity = ErrorSeverity.MEDIUM;
        retryable = true;
      }

      return new ApplicationError(
        error.message,
        type,
        severity,
        {
          context,
          originalError: error,
          retryable,
        }
      );
    }

    return new ApplicationError(
      'An unknown error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      {
        context,
        originalError: error,
      }
    );
  }
}

// Error handling utilities
export const createNetworkError = (message: string, context?: Record<string, unknown>): ApplicationError => 
  new ApplicationError(message, ErrorType.NETWORK, ErrorSeverity.HIGH, { context, retryable: true });

export const createAuthError = (message: string, context?: Record<string, unknown>): ApplicationError => 
  new ApplicationError(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, { context, retryable: false });

export const createValidationError = (message: string, context?: Record<string, unknown>): ApplicationError => 
  new ApplicationError(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, { context, retryable: false });

export const createServerError = (message: string, context?: Record<string, unknown>): ApplicationError => 
  new ApplicationError(message, ErrorType.SERVER_ERROR, ErrorSeverity.HIGH, { context, retryable: true });

// Error handler class for centralized error management
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  handle(error: unknown, context?: Record<string, unknown>): ApplicationError {
    const appError = ApplicationError.fromError(error, context);
    
    // Log error based on severity
    this.logError(appError);
    
    // Notify listeners
    this.notifyListeners(appError.toJSON());
    
    return appError;
  }

  private logError(error: ApplicationError): void {
    const logMethod = this.getLogMethod(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    if (error.context) {
      logMethod(logMessage, error.context);
    } else {
      logMethod(logMessage);
    }
    
    if (error.originalError && error.originalError !== error) {
      console.error('Original error:', error.originalError);
    }
  }

  private getLogMethod(severity: ErrorSeverity): (...args: unknown[]) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.debug;
      case ErrorSeverity.MEDIUM:
        return console.info;
      case ErrorSeverity.HIGH:
        return console.warn;
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: Record<string, unknown>): ApplicationError => {
    return errorHandler.handle(error, context);
  };

  const addErrorListener = (listener: (error: AppError) => void) => {
    errorHandler.addErrorListener(listener);
  };

  const removeErrorListener = (listener: (error: AppError) => void) => {
    errorHandler.removeErrorListener(listener);
  };

  return {
    handleError,
    addErrorListener,
    removeErrorListener,
  };
};
