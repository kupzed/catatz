"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  BudgetWithUsage,
  RekapDetailBulanan,
  RekapBulanan,
} from "@/actions/rekap-action";
import {
  getBudgetWithUsage,
  getRekapDetailBulanan,
} from "@/actions/rekap-action";
import { RekapBarSection } from "./rekap-bar-section";
import { RekapBudgetSection } from "./rekap-budget-section";
import { RekapMonthlyDetailSection } from "./rekap-monthly-detail-section";
import { RekapSummaryCards } from "./rekap-summary-cards";
import { PageHeader } from "@/components/common";

type Props = {
  initialBulanan: RekapBulanan[];
  initialDetail: RekapDetailBulanan;
  initialBudget: BudgetWithUsage[];
  currentBulan: number;
  currentTahun: number;
};

export default function RekapPageClient({
  initialBulanan,
  initialDetail,
  initialBudget,
  currentBulan,
  currentTahun,
}: Props) {
  const [selectedBulan, setSelectedBulan] = useState(currentBulan);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [detailByMonth, setDetailByMonth] = useState<
    Record<number, RekapDetailBulanan>
  >(() => ({
    [currentBulan]: initialDetail,
  }));
  const [budgetByMonth, setBudgetByMonth] = useState<
    Record<number, BudgetWithUsage[]>
  >(() => ({
    [currentBulan]: initialBudget,
  }));

  const totalIncome = initialBulanan.reduce((s, d) => s + d.total_income, 0);
  const totalExpense = initialBulanan.reduce((s, d) => s + d.total_expense, 0);
  const selectedDetail = detailByMonth[selectedBulan] ?? initialDetail;
  const selectedBudget = budgetByMonth[selectedBulan] ?? [];
  const selectedMonth = initialBulanan.find((d) => d.bulan === selectedBulan);

  async function handleSelectMonth(bulan: number) {
    if (bulan === selectedBulan || isLoadingMonth) return;

    const previousBulan = selectedBulan;
    setSelectedBulan(bulan);

    if (detailByMonth[bulan]) return;

    setIsLoadingMonth(true);
    try {
      const [detail, budget] = await Promise.all([
        getRekapDetailBulanan(bulan, currentTahun),
        getBudgetWithUsage(bulan, currentTahun),
      ]);

      setDetailByMonth((prev) => ({ ...prev, [bulan]: detail }));
      setBudgetByMonth((prev) => ({ ...prev, [bulan]: budget }));
    } catch {
      setSelectedBulan(previousBulan);
      toast.error("Gagal memuat rincian rekap");
    } finally {
      setIsLoadingMonth(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader title="Rekap Keuangan" subtitle={`Analitik ${currentTahun}`} />

      <RekapSummaryCards
        currentBulan={selectedBulan}
        currentTahun={currentTahun}
        currentMonth={selectedMonth}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <RekapBarSection
        data={initialBulanan}
        selectedBulan={selectedBulan}
        onSelectMonth={handleSelectMonth}
        isLoading={isLoadingMonth}
      />

      <RekapMonthlyDetailSection
        detail={selectedDetail}
        isLoading={isLoadingMonth}
      />

      <RekapBudgetSection
        budgets={selectedBudget}
        currentBulan={selectedBulan}
      />
    </div>
  );
}
