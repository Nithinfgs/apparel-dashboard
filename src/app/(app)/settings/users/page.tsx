import { DEMO_PROFILES } from "@/lib/auth/session";
import { PageHeader, UserAvatar, StatusBadge } from "@/components/shared";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

export default function UsersSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Users" description="Everyone with access to Texcroft OS." />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {DEMO_PROFILES.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={p.fullName} avatarUrl={p.avatarUrl} />
                <div>
                  <p className="text-sm font-medium">{p.fullName}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
              <StatusBadge status={p.role} label={ROLE_LABELS[p.role]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
