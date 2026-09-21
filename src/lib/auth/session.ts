import "server-only";
import { cookies } from "next/headers";
import { profiles } from "@/lib/seed";
import type { Profile } from "@/types";

const SESSION_COOKIE = "texcroft-demo-role";
const DEFAULT_PROFILE_ID = "user-admin";

/**
 * Demo/dev session resolution. No Supabase project is connected in this
 * environment (AGENTS.md §4) — this reads a role-switch cookie set by the
 * login/demo-switcher UI instead of a real Supabase Auth session. Swapping
 * to Supabase Auth only touches this file: replace the cookie read below
 * with `supabase.auth.getUser()` + a `profiles` table lookup, and every
 * caller (`getCurrentUser()`) is unaffected.
 */
export async function getCurrentUser(): Promise<Profile> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(SESSION_COOKIE)?.value ?? DEFAULT_PROFILE_ID;
  return profiles.find((p) => p.id === profileId) ?? profiles.find((p) => p.id === DEFAULT_PROFILE_ID)!;
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export const DEMO_PROFILES = profiles;

const INTERNAL_STAFF_ROLES = new Set(["admin", "management", "merchandiser", "sourcing_manager", "production_manager", "qc_inspector"]);

/** Internal staff who can be assigned as an owner on a production issue — excludes buyers and factory partners. */
export const INTERNAL_STAFF_PROFILES = profiles.filter((p) => INTERNAL_STAFF_ROLES.has(p.role));
