"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function getInitials(name?: string | null, email?: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function UserMenu({
  user,
}: {
  user: { email: string; full_name?: string | null };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          {user.full_name && (
            <p className="font-medium">{user.full_name}</p>
          )}
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </Link>
        <Link href="/profile/hhh-legacy">
          <DropdownMenuItem>HHH Legacy Miles</DropdownMenuItem>
        </Link>
        <Link href="/checkin">
          <DropdownMenuItem>Check In</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href="/admin">
          <DropdownMenuItem>Admin</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="POST">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              Sign Out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
