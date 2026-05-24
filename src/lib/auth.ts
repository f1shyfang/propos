import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      organization: {
        type: "string",
        required: false,
        defaultValue: "",
        fieldName: "organization",
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "agent",
        fieldName: "role",
      },
    },
  },
});

export type UserRole = "agent" | "client";

export function getUserRole(user: { role?: string | null }): UserRole {
  return user.role === "client" ? "client" : "agent";
}

export type Session = typeof auth.$Infer.Session;
