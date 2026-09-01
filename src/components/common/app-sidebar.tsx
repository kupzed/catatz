"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Landmark,
  BarChart3,
  HandCoins,
  Tags,
  Settings,
  LogOut,
  Plus,
  ChevronsUpDown,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { signOut } from "@/actions/auth-action";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppSidebarUser = {
  name: string | null;
  email: string;
  avatar_url?: string | null;
} | null;

export type AppSidebarProps = {
  user?: AppSidebarUser;
};

// ─── Navigation config ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    group: "Menu Utama",
    items: [
      { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
      { href: "/wallets", label: "Rekening", icon: Landmark },
      { href: "/reports", label: "Rekap", icon: BarChart3 },
      { href: "/debts", label: "Hutang", icon: HandCoins },
    ],
  },
  {
    group: "Lainnya",
    items: [{ href: "/categories", label: "Kategori", icon: Tags }],
  },
] as const;

// ─── Sidebar Header with collapse toggle ─────────────────────────────────────

function SidebarHeaderContent() {
  const { toggleSidebar, state, isMobile } = useSidebar();
  // Sidebar on mobile is always an expanded drawer, ignore desktop's collapsed state
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <div className="flex w-full overflow-hidden items-center justify-between px-2 py-3 min-h-13 select-none">
      {/* Expanded: logo + name */}
      {!isCollapsed && (
        <Link
          href="/transaksi"
          className="flex items-center gap-3 px-2 flex-1 min-w-0"
        >
          <Image
            src="/catatz.svg"
            alt="CatatZ"
            width={30}
            height={30}
            className="shrink-0 pointer-events-none"
          />
          <span className="font-semibold text-[17px] text-foreground truncate tracking-tight">
            CatatZ
          </span>
        </Link>
      )}

      {/* Collapse / expand toggle button — always visible */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className={cn(
          "flex items-center justify-center rounded-[8px] p-2 text-muted-foreground",
          "hover:bg-surface-strong hover:text-foreground transition-colors",
          "cursor-pointer shrink-0 ml-auto",
          isCollapsed && "w-full justify-center",
        )}
      >
        <PanelLeft className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}

// ─── UserCard component ───────────────────────────────────────────────────────

function UserCard({ user }: { user: AppSidebarUser }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="gap-3 h-auto py-2 px-2 hover:bg-muted/60 border border-transparent hover:border-border/40 transition-all data-[state=open]:bg-muted/60 data-[state=open]:border-border/40"
              tooltip="Akun"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-surface-strong flex items-center justify-center text-foreground text-xs font-semibold shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    className="w-full h-full object-cover"
                    alt={user.name ?? user.email}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Info — hidden in icon-only mode */}
              <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium text-foreground truncate leading-tight">
                  {user?.name ?? user?.email ?? "Pengguna"}
                </span>
              </div>

              {/* Chevron — hidden in icon-only mode */}
              <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-64 mb-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.name ?? "Pengguna"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <ConfirmDialog
              title="Keluar Akun?"
              description="Anda harus login kembali untuk mengakses data."
              onConfirm={() => signOut()}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ─── Main sidebar component ───────────────────────────────────────────────────

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: Logo + collapse toggle ── */}
      <SidebarHeader className="p-0">
        <SidebarHeaderContent />
      </SidebarHeader>

      <SidebarContent className="py-1.5 select-none">
        {/* ── CTA: Transaksi baru ── */}
        <SidebarGroup className="py-1.5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={cn(
                  "gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm h-9 px-4",
                  "hover:bg-[#003ecc] hover:text-white",
                  "transition-colors",
                )}
                tooltip="Transaksi baru"
                onClick={handleMobileClick}
              >
                <Link href="/transaksi?new=true">
                  <Plus className="h-4 w-4" />
                  <span>Transaksi baru</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Nav groups ── */}
        {NAV_ITEMS.map((group) => (
          <SidebarGroup key={group.group} className="py-1">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium px-2 h-7">
              {group.group}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "text-muted-foreground transition-all",
                        "hover:text-foreground hover:bg-surface-strong",
                        isActive &&
                          "bg-surface-strong text-foreground font-semibold hover:bg-surface-strong",
                      )}
                      onClick={handleMobileClick}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer: User card ── */}
      <SidebarFooter className="border-t border-hairline pt-2 pb-2">
        <UserCard user={user ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
