import type { Profile } from "@/types";
import { GlobalSearch } from "./global-search";
import { QuickCreate } from "./quick-create";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { Breadcrumbs } from "./breadcrumbs";
import { MobileNav } from "./mobile-nav";

export function Header({ user }: { user: Profile }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav role={user.role} />
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
        <QuickCreate />
        <NotificationBell user={user} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
