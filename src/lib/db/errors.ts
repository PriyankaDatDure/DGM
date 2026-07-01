export function formatDbError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Missing required environment variable")) {
      return "Database is not configured. Set DATABASE_* variables in .env.local.";
    }
    return error.message;
  }
  return "An unexpected database error occurred.";
}
