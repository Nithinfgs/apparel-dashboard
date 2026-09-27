import Link from "next/link";
import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerById } from "@/lib/data";
import { PortalNav } from "@/components/layout/portal-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const buyerId = await resolvePortalBuyerId();
  const buyer = await getBuyerById(buyerId);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              APPAREL <span className="font-normal text-muted-foreground">Buyer Portal</span>
            </p>
            <p className="text-xs text-muted-foreground">{buyer?.companyName ?? "Buyer"}</p>
          </div>
          <div className="flex items-center gap-3">
            <PortalNav />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5" /> Exit portal
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
