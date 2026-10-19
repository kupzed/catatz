"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Fragment } from "react";

const ROUTE_NAMES: Record<string, string> = {
  transactions: "Transaksi",
  wallets: "Rekening",
  reports: "Rekap",
  debts: "Hutang",
  settings: "Pengaturan",
  categories: "Kategori",
  detail: "Detail Rekap",
};

export default function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              segment,
            );
          const prevSegment = index > 0 ? segments[index - 1] : "";
          const label =
            ROUTE_NAMES[segment] ??
            (isUuid && prevSegment === "transactions"
              ? "Detail Transaksi"
              : isUuid && prevSegment === "debts"
                ? "Detail Hutang & Piutang"
                : segment.charAt(0).toUpperCase() + segment.slice(1));
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-semibold text-foreground">{label}</BreadcrumbPage>
                ) : (
                  <Link
                    href={href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
