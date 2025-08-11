import { NextResponse } from 'next/server';
import { z } from 'zod';

// Modern Next.js 15 API response helpers
export class ApiResponse {
  static success<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(
    message: string, 
    status = 500, 
    details?: unknown
  ) {
    // Next.js 15 automatically logs errors with proper stack traces
    const error = {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details && { details }),
      timestamp: new Date().toISOString(),
    };

    // Console log for development (Next.js will handle production logging)
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error ${status}]:`, message, details);
    }

    return NextResponse.json(error, { status });
  }

  static validationError(error: z.ZodError) {
    return this.error('Validation failed', 400, error.issues);
  }

  static notFound(resource = 'Resource') {
    return this.error(`${resource} not found`, 404);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static methodNotAllowed(allowedMethods: string[]) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Method not allowed',
        allowedMethods 
      },
      { 
        status: 405,
        headers: { 'Allow': allowedMethods.join(', ') }
      }
    );
  }
}

// Modern async error wrapper - cleaner than try/catch everywhere
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | Response>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      return result as NextResponse;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponse.validationError(error);
      }
      
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('not yet implemented')) {
          return ApiResponse.error('Feature not implemented', 501, error.message);
        }
        
        if (error.message.includes('ECONNREFUSED')) {
          return ApiResponse.error('Database connection failed', 503);
        }

        return ApiResponse.error(
          process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Internal server error',
          500,
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        );
      }

      return ApiResponse.error('Unknown error occurred');
    }
  };
}