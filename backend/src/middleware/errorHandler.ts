import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err instanceof Error && err.name === "ValidationError") {
    res.status(400).json({ error: { message: err.message } });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: { message } });
}
