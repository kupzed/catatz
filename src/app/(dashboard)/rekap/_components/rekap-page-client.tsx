"use client";

import type {
  BudgetWithUsage,
  RekapBulanan,
  RekapKategori,
} from "@/actions/rekap-action";
import { RekapBarSection } from "./rekap-bar-section";
import { RekapBudgetSection } from "./rekap-budget-section";
import { RekapKategoriSection } from "./rekap-kategori-section";
import { RekapSummaryCards } from "./rekap-summary-cards";
import { PageHeader } from "@/components/common";

type Props = {
  initialBulanan: RekapBulanan[];
  initialKategori: RekapKategori[];
  initialBudget: BudgetWithUsage[];
  currentBulan: number;
  currentTahun: number;
};

export default function RekapPageClient({
  initialBulanan,
  initialKategori,
  initialBudget,
  currentBulan,
  currentTahun,
}: Props) {
  const totalIncome = initialBulanan.reduce((s, d) => s + d.total_income, 0);
  const totalExpense = initialBulanan.reduce((s, d) => s + d.total_expense, 0);

  const currentMonth = initialBulanan.find((d) => d.bulan === currentBulan);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader title="Rekap Keuangan" subtitle={`Analitik ${currentTahun}`} />

      <RekapSummaryCards
        currentBulan={currentBulan}
        currentTahun={currentTahun}
        currentMonth={currentMonth}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <RekapBarSection data={initialBulanan} />

      <RekapKategoriSection
        data={initialKategori}
        currentBulan={currentBulan}
      />

      <RekapBudgetSection
        budgets={initialBudget}
        currentBulan={currentBulan}
      />
    </div>
  );
}
