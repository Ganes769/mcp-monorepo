import { createClient, type Client } from "@libsql/client/web";

let client: Client | null = null;

export function normalizeTursoUrl(url: string): string {
  return url.trim();
}

export function getTursoClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
    }

    client = createClient({
      url: normalizeTursoUrl(url),
      authToken: authToken.trim(),
    });
  }

  return client;
}

export function isTursoEnabled(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}
