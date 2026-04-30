'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import {
  ArrowLeftRight,
  Landmark,
  BarChart3,
  HandCoins,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from '@/actions/auth-action';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    group: 'Menu Utama',
    items: [
      { href: '/transaksi', label: 'Transaksi',   icon: ArrowLeftRight },
      { href: '/rekening',  label: 'Rekening',    icon: Landmark },
      { href: '/rekap',     label: 'Rekap',       icon: BarChart3 },
      { href: '/hutang',    label: 'Hutang',      icon: HandCoins },
    ],
  },
  {
    group: 'Lainnya',
    items: [
      { href: '/settings',  label: 'Pengaturan',  icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/transaksi" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            💰
          </div>
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            CatatZ
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {NAV_ITEMS.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => signOut()}
              className="text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
