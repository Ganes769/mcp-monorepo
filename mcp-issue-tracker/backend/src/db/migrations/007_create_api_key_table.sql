-- Better Auth apiKey plugin table (generated via better-auth getMigrations).
-- This file was previously empty, so the apikey table was never created and
-- API key creation failed silently after sign-up.
CREATE TABLE IF NOT EXISTS "apikey" (
  "id" text not null primary key,
  "name" text,
  "start" text,
  "prefix" text,
  "key" text not null,
  "userId" text not null references "user" ("id"),
  "refillInterval" integer,
  "refillAmount" integer,
  "lastRefillAt" date,
  "enabled" integer,
  "rateLimitEnabled" integer,
  "rateLimitTimeWindow" integer,
  "rateLimitMax" integer,
  "requestCount" integer,
  "remaining" integer,
  "lastRequest" date,
  "expiresAt" date,
  "createdAt" date not null,
  "updatedAt" date not null,
  "permissions" text,
  "metadata" text
);
