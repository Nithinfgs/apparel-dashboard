import Link from "next/link";
import { resolvePortalFactoryId } from "@/lib/auth/portal-context";
import { getFactoryById } from "@/lib/data";
import { LayoutDashboard, ClipboardEdit, AlertCircle, ArrowLeft } from "lucide-react";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const factoryId = await resolvePortalFactoryId();
  const factory = await getFactoryById(factoryId);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-background px-4 py-3">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          TEXCROFT <span className="font-normal text-muted-foreground">Partner</span>
        </p>
        <p className="text-xs text-muted-foreground">{factory?.name ?? "Factory"}</p>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <nav className="grid grid-cols-4 border-t border-border bg-background text-[11px]">
        <Link href="/partner/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground hover:text-foreground">
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </Link>
        <Link href="/partner/production" className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground hover:text-foreground">
          <ClipboardEdit className="h-5 w-5" /> Production
        </Link>
        <Link href="/partner/issues" className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground hover:text-foreground">
          <AlertCircle className="h-5 w-5" /> Issues
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" /> Exit
        </Link>
      </nav>
    </div>
  );
}
