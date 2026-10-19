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
import { useBreadcrumbTitle } from "@/providers/breadcrumb-title-provider";

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
  const { title: customTitle } = useBreadcrumbTitle();
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
          const isLast = index === segments.length - 1;

          let label = ROUTE_NAMES[segment];
          if (!label) {
            if (isLast && customTitle) {
              label = customTitle;
            } else if (isUuid && prevSegment === "wallets") {
              label = "Detail Rekening";
            } else if (isUuid && prevSegment === "transactions") {
              label = "Detail Transaksi";
            } else if (isUuid && prevSegment === "debts") {
              label = "Detail Hutang & Piutang";
            } else if (isUuid && prevSegment === "categories") {
              label = "Detail Kategori";
            } else {
              label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          }

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-semibold text-foreground truncate max-w-32.5 sm:max-w-xs inline-block">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <Link
                    href={href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-25 sm:max-w-xs inline-block"
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
