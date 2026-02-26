import { NextResponse } from 'next/server';
import { z } from 'zod';

// Modern Next.js 15 API response helpers
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  details?: unknown
) {
  const body = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error ${status}]:`, message, details);
  }

  return NextResponse.json(body, { status });
}

export function apiValidationError(error: z.ZodError) {
  return apiError('Validation failed', 400, error.issues);
}

export function apiNotFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404);
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError(message, 401);
}

export function apiForbidden(message = 'Forbidden') {
  return apiError(message, 403);
}

export function apiMethodNotAllowed(allowedMethods: string[]) {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      allowedMethods,
    },
    {
      status: 405,
      headers: { Allow: allowedMethods.join(', ') },
    }
  );
}

// Backwards-compat namespace for existing callers
export const ApiResponse = {
  success: apiSuccess,
  error: apiError,
  validationError: apiValidationError,
  notFound: apiNotFound,
  unauthorized: apiUnauthorized,
  forbidden: apiForbidden,
  methodNotAllowed: apiMethodNotAllowed,
};

// Modern async error wrapper - cleaner than try/catch everywhere
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse | Response>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      return result as NextResponse;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return apiValidationError(error);
      }

      if (error instanceof Error) {
        if (error.message.includes('not yet implemented')) {
          return apiError('Feature not implemented', 501, error.message);
        }

        if (error.message.includes('ECONNREFUSED')) {
          return apiError('Database connection failed', 503);
        }

        return apiError(
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
          500,
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        );
      }

      return apiError('Unknown error occurred');
    }
  };
}
