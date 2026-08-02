import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "./auth.js";
import { getDatabase } from "./db/database.js";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

function convertHeaders(requestHeaders: FastifyRequest["headers"]): Headers {
  const headers = new Headers();
  Object.entries(requestHeaders).forEach(([key, value]) => {
    if (value) {
      const headerValue = Array.isArray(value) ? value[0] : value;
      if (typeof headerValue === "string") {
        headers.append(key, headerValue);
      }
    }
  });
  return headers;
}

function getProvidedServiceToken(request: FastifyRequest): string | undefined {
  const apiKeyHeader = request.headers["x-api-key"];
  const mcpHeader = request.headers["x-mcp-service-token"];
  const fromApiKey = Array.isArray(apiKeyHeader)
    ? apiKeyHeader[0]
    : apiKeyHeader;
  const fromMcp = Array.isArray(mcpHeader) ? mcpHeader[0] : mcpHeader;

  const authHeader = request.headers.authorization;
  const bearer =
    typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

  return (fromMcp || fromApiKey || bearer)?.trim() || undefined;
}

/**
 * Stable MCP/service auth that does NOT use Better Auth API keys.
 * Set once on the host:
 *   MCP_SERVICE_TOKEN=<long random string>
 *   MCP_SERVICE_USER_EMAIL=<existing user email to act as>
 * Cloudflare Worker stores the same token in ISSUES_API_KEY.
 * Regenerating personal API keys in the UI will not break MCP.
 */
async function tryServiceTokenAuth(
  request: AuthenticatedRequest,
): Promise<boolean> {
  const expected = process.env.MCP_SERVICE_TOKEN?.trim();
  if (!expected) return false;

  const provided = getProvidedServiceToken(request);
  if (!provided || provided !== expected) return false;

  const email = process.env.MCP_SERVICE_USER_EMAIL?.trim();
  if (!email) {
    console.error(
      "MCP_SERVICE_TOKEN is set but MCP_SERVICE_USER_EMAIL is missing",
    );
    return false;
  }

  const db = await getDatabase();
  try {
    const user = await db.get(
      `SELECT id, name, email, emailVerified, image, createdAt, updatedAt
       FROM user WHERE lower(email) = lower(?) LIMIT 1`,
      [email],
    );

    if (!user) {
      console.error(
        `MCP_SERVICE_USER_EMAIL "${email}" does not match any user`,
      );
      return false;
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.emailVerified),
      image: user.image ?? null,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
    return true;
  } finally {
    await db.close();
  }
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply,
) {
  try {
    if (await tryServiceTokenAuth(request)) {
      return;
    }

    const headers = convertHeaders(request.headers);

    // Cookie session or Better Auth personal API key (x-api-key)
    const session = await auth.api.getSession({
      headers: headers,
    });

    if (!session?.user) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    request.user = {
      ...session.user,
      image: session.user.image ?? null,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid authentication",
    });
  }
}

export async function optionalAuthMiddleware(
  request: AuthenticatedRequest,
  _reply: FastifyReply,
) {
  try {
    if (await tryServiceTokenAuth(request)) {
      return;
    }

    const headers = convertHeaders(request.headers);
    const session = await auth.api.getSession({
      headers: headers,
    });

    if (session?.user) {
      request.user = {
        ...session.user,
        image: session.user.image ?? null,
      };
    }
  } catch (error) {
    console.debug("Optional auth failed:", error);
  }
}
