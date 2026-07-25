/**
 * Admin auth + shared helpers.
 *
 * ASSUMPTIONS about your schema (adjust to match reality):
 *  - User model has a boolean field `isAdmin`
 *  - User model has a `status` enum/string: "ACTIVE" | "SUSPENDED" | "BANNED"
 *  - User model has a `isShadowBanned` boolean
 *  - Report model has: id, reporterId, reportedId, reason, details, status
 *    ("OPEN" | "RESOLVED" | "DISMISSED"), createdAt, and relations
 *    `reporter` and `reported` pointing back to User
 *
 * If your field names differ, do a find-and-replace across this folder —
 * the logic doesn't need to change, just the field names.
 */

import { prisma, requireUser, json } from "@/lib/core";

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || !("isAdmin" in user) || !(user as any).isAdmin) {
    throw new AdminAuthError();
  }
  return user;
}

export class AdminAuthError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminAuthError";
  }
}

export function adminJsonError(err: unknown) {
  if (err instanceof AdminAuthError) {
    return json({ error: "Admin access required" }, 403);
  }
  console.error(err);
  return json({ error: "Server error" }, 500);
}

export { prisma, json };
