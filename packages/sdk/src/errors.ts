/**
 * Sign in with Ethos SDK - Error Classes
 * 
 * Custom error types for authentication failures.
 * 
 * @module errors
 */

/**
 * Authentication error with error code and details
 */
export class EthosAuthError extends Error {
  /** Error code (e.g., 'invalid_address', 'signature_rejected') */
  public readonly code: string;
  /** Additional error details */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EthosAuthError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown (V8 engines)
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: Function) => void;
    };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, EthosAuthError);
    }
  }

  /**
   * Create error from API response
   */
  static fromResponse(
    response: { error?: string; error_description?: string },
    fallbackCode: string = 'unknown_error'
  ): EthosAuthError {
    return new EthosAuthError(
      response.error_description || response.error || 'An unknown error occurred',
      response.error || fallbackCode,
      response
    );
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}
