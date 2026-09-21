"use client";

import { LogOut, UserCog } from "lucide-react";
import { UserAvatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile } from "@/types";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";

export function UserMenu({ user }: { user: Profile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-2 px-1.5">
          <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} className="h-6.5 w-6.5" />
          <span className="hidden text-left text-xs leading-tight md:block">
            <span className="block font-medium text-foreground">{user.fullName}</span>
            <span className="block text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">
            <UserCog className="h-4 w-4" /> Switch demo role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} variant="destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
