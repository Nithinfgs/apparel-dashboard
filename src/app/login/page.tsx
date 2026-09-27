import { DEMO_PROFILES } from "@/lib/auth/session";
import { signInAs } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLE_DESTINATIONS: Record<string, string> = {
  buyer: "/portal/dashboard",
  factory_partner: "/partner/dashboard",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            APPAREL <span className="font-normal text-muted-foreground">OS</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in as a demo user to explore the platform.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demo accounts</CardTitle>
            <CardDescription>
              Each role sees a different slice of the system — try Admin for the full picture, or Buyer / Factory Partner for the external portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {DEMO_PROFILES.map((profile) => (
              <form key={profile.id} action={signInAs.bind(null, profile.id, ROLE_DESTINATIONS[profile.role] ?? "/dashboard")}>
                <Button type="submit" variant="secondary" className="h-auto w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left">
                  <span className="text-sm font-medium text-foreground">{profile.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[profile.role]} · {profile.email}
                  </span>
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
