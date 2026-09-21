"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName, DEMO_PROFILES } from "./session";

export async function signInAs(profileId: string, redirectTo: string) {
  const profile = DEMO_PROFILES.find((p) => p.id === profileId);
  if (!profile) throw new Error("Unknown demo profile.");

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(redirectTo);
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
  redirect("/login");
}
