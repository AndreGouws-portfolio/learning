import Link from "next/link";
import { Plus } from "lucide-react";
import { GlobalSearch } from "@/components/global-search";
import { UserMenu } from "@/components/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Topbar({ name, email }: { name: string; email: string }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/contacts/new">Contact</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/companies/new">Company</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/deals/new">Deal</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tasks?new=1">Task</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
