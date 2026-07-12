import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function sendError(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues[0]?.message ?? "Invalid request body",
      },
    });
  }

  console.error(error);

  return response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
}
