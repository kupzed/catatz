"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Hutang, HutangCicilan, JenisTransaksiHutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { useTranslation } from "@/i18n/use-translation";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { deleteHutang, toggleHutangStatus, updateHutangTipe } from "@/actions/hutang-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  HandCoins,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { HutangTransactionDialog } from "./hutang-transaction-dialog";
import { HutangContactEditDialog } from "./hutang-contact-edit-dialog";
import { HutangTransactionList } from "./hutang-transaction-list";
import { percentage, cn } from "@/lib/utils";

type Props = {
  initialHutang: Hutang;
  rekening: Rekening[];
};

export function HutangDetailClient({ initialHutang, rekening }: Props) {
  const router = useRouter();
  const { dict } = useTranslation();
  const { formatRupiah } = useSystemPreferences();
  const [hutang, setHutang] = useState<Hutang>(initialHutang);

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editTxData, setEditTxData] = useState<HutangCicilan | null>(null);
  const [defaultTxJenis, setDefaultTxJenis] = useState<JenisTransaksiHutang>("pembayaran");
  const [togglingStatus, setTogglingStatus] = useState(false);

  const isPiutang = hutang.tipe === "memberi";

  // Hitung total pinjaman (pokok awal + pinjaman tambahan)
  const additionalPinjaman = (hutang.cicilan ?? [])
    .filter((c) => c.jenis_transaksi === "pinjaman")
    .reduce((sum, c) => sum + Number(c.nominal), 0);
  const totalPinjaman = Number(hutang.total_pinjaman) + additionalPinjaman;

  // Hitung total pembayaran yang sudah masuk/keluar
  const totalPembayaran = (hutang.cicilan ?? [])
    .filter((c) => (c.jenis_transaksi ?? "pembayaran") === "pembayaran")
    .reduce((sum, c) => sum + Number(c.nominal), 0);

  // Sisa nominal riil
  const sisaRiil = Math.max(totalPinjaman - totalPembayaran, 0);
  const kelebihanBayar = Math.max(totalPembayaran - totalPinjaman, 0);
  const pct = totalPinjaman > 0 ? percentage(totalPembayaran, totalPinjaman) : 0;

  // Status Lunas (tag visual)
  const isLunasTag = hutang.status === "lunas" || hutang.is_lunas_manual === true;

  async function handleToggleStatus() {
    setTogglingStatus(true);
    const nextStatus = !isLunasTag;
    const res = await toggleHutangStatus(hutang.id, nextStatus);
    if (res.success && res.data) {
      setHutang(res.data);
      toast.success(
        nextStatus
          ? dict.debts.toasts.markedPaid
          : dict.debts.toasts.markedUnpaid,
      );
    } else {
      toast.error(res.error ?? dict.debts.toasts.statusChangeFailed);
    }
    setTogglingStatus(false);
  }

  async function handleDeleteParty() {
    const res = await deleteHutang(hutang.id);
    if (res.success) {
      toast.success(dict.debts.toasts.partyDeleted);
      router.push("/debts");
    } else {
      toast.error(res.error ?? dict.debts.toasts.partyDeleteFailed);
    }
  }

  async function handleSwitchTipe(newTipe: "memberi" | "menerima") {
    if (newTipe === hutang.tipe) return;
    const res = await updateHutangTipe(hutang.id, newTipe);
    if (res.success && res.data) {
      setHutang(res.data);
      toast.success(dict.debts.toasts.typeSwitched);
    } else {
      toast.error(res.error ?? dict.debts.toasts.typeSwitchFailed);
    }
  }

  function openAddTx(jenis: JenisTransaksiHutang) {
    setEditTxData(null);
    setDefaultTxJenis(totalPinjaman === 0 ? "pinjaman" : jenis);
    setTxDialogOpen(true);
  }

  function openEditTx(item: HutangCicilan) {
    setEditTxData(item);
    setDefaultTxJenis(item.jenis_transaksi ?? "pembayaran");
    setTxDialogOpen(true);
  }

  const hasTransactions = (hutang.cicilan ?? []).length > 0 || Number(hutang.total_pinjaman) > 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/debts")}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full h-8 px-2.5 mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {dict.debts.detail.backToList}
          </Button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[32px] font-normal tracking-[-0.4px] text-foreground">
              {hutang.nama_entitas}
            </h1>
            <Badge
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold border-0",
                isLunasTag
                  ? "bg-semantic-up/10 text-semantic-up"
                  : "bg-surface-strong text-muted-foreground",
              )}
            >
              {isLunasTag ? `✓ ${dict.debts.status.paidOff}` : dict.debts.status.unpaid}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {hutang.catatan || dict.debts.detail.noNotes}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="rounded-full gap-1.5 border-hairline h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold"
          >
            {isLunasTag ? (
              <>
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                {dict.debts.detail.markAsActive}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-semantic-up" />
                {dict.debts.detail.markAsPaid}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setContactDialogOpen(true)}
            className="rounded-full gap-1.5 border-hairline h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-semibold"
          >
            <Pencil className="h-3.5 w-3.5" />
            {dict.debts.detail.editInfo}
          </Button>

          <ConfirmDialog
            title={dict.debts.detail.deletePartyConfirmTitle}
            description={dict.debts.detail.deletePartyConfirmDescription}
            onConfirm={handleDeleteParty}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 p-0 text-semantic-down border-hairline hover:bg-semantic-down/10"
              aria-label={dict.debts.detail.deleteContactAria}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      {/* Tipe Selector (Only if no transactions yet) */}
      {!hasTransactions && (
        <div className="rounded-card border border-hairline bg-surface-soft/60 p-4 space-y-2.5">
          <p className="text-xs font-medium text-foreground">
            {dict.debts.detail.selectRelationshipPrompt}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <Button
              size="sm"
              variant={isPiutang ? "default" : "outline"}
              className={cn(
                "rounded-full text-xs h-10 px-4 w-full justify-center transition-all",
                isPiutang
                  ? "bg-primary text-white hover:bg-primary-active font-semibold shadow-none"
                  : "bg-card border-hairline hover:bg-surface-strong text-foreground",
              )}
              onClick={() => handleSwitchTipe("memberi")}
            >
              📤 {dict.debts.types.receivable}
            </Button>
            <Button
              size="sm"
              variant={!isPiutang ? "default" : "outline"}
              className={cn(
                "rounded-full text-xs h-10 px-4 w-full justify-center transition-all",
                !isPiutang
                  ? "bg-primary text-white hover:bg-primary-active font-semibold shadow-none"
                  : "bg-card border-hairline hover:bg-surface-strong text-foreground",
              )}
              onClick={() => handleSwitchTipe("menerima")}
            >
              📥 {dict.debts.types.debt}
            </Button>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {isPiutang ? dict.debts.detail.totalLoaned : dict.debts.detail.totalReceived}
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-muted-foreground">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-semibold text-foreground">
            {formatRupiah(totalPinjaman)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPinjaman > 0
              ? isPiutang
                ? dict.debts.detail.principalLentDesc
                : dict.debts.detail.principalBorrowedDesc
              : dict.debts.detail.noPrincipalYet}
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {isPiutang ? dict.debts.detail.totalReturned : dict.debts.detail.totalPaid}
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-semantic-up">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-semibold text-semantic-up">
            {formatRupiah(totalPembayaran)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPinjaman > 0
              ? dict.debts.detail.paidPercent.replace("{percent}", String(pct))
              : dict.debts.detail.noPaymentYet}
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {dict.debts.detail.realRemainingBalance}
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-semantic-down">
              <HandCoins className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              "mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-semibold",
              totalPinjaman === 0
                ? "text-muted-foreground"
                : sisaRiil > 0
                  ? "text-semantic-down"
                  : "text-semantic-up",
            )}
          >
            {formatRupiah(sisaRiil)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPinjaman === 0
              ? dict.debts.detail.noLoanYet
              : sisaRiil > 0
                ? dict.debts.detail.stillPending
                : dict.debts.detail.noRemainingBill}
          </p>
        </div>
      </div>

      {/* Kelebihan Bayar / Bunga Notice */}
      {kelebihanBayar > 0 && (
        <div className="rounded-card border border-semantic-up/30 bg-semantic-up/5 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-semantic-up">
              {dict.debts.detail.overpaymentDetected}
            </p>
            <p className="text-xs text-muted-foreground">
              {dict.debts.detail.overpaymentDescription.split("{amount}")[0]}
              <span className="font-mono font-semibold text-semantic-up">
                {formatRupiah(kelebihanBayar)}
              </span>
              {dict.debts.detail.overpaymentDescription.split("{amount}")[1] ?? ""}
            </p>
          </div>
          <Badge className="bg-semantic-up text-white rounded-full px-3 py-1 text-xs">
            +{formatRupiah(kelebihanBayar)}
          </Badge>
        </div>
      )}

      {/* Progress Bar (Only when pinjaman > 0) */}
      {totalPinjaman > 0 && (
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {dict.debts.detail.paidOffPercentage.replace("{percent}", String(pct))}
            </span>
            <span className="font-mono">
              {formatRupiah(totalPembayaran)} / {formatRupiah(totalPinjaman)}
            </span>
          </div>
          <Progress value={Math.min(pct, 100)} className="h-2 [&>div]:bg-primary" />
        </div>
      )}

      {/* Action Buttons for Transactions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {dict.debts.detail.transactionsHistory}
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {totalPinjaman === 0 ? (
            <Button
              size="sm"
              onClick={() => openAddTx("pinjaman")}
              className="rounded-full bg-primary hover:bg-primary-active text-white font-semibold gap-1.5 h-10 px-5 w-full sm:w-auto shadow-none"
            >
              <Plus className="h-4 w-4" />
              {isPiutang
                ? dict.debts.detail.giveLoanButton
                : dict.debts.detail.receiveLoanButton}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => openAddTx("pembayaran")}
                className="rounded-full bg-primary hover:bg-primary-active text-white font-semibold gap-1.5 h-10 px-4 flex-1 sm:flex-initial shadow-none"
              >
                <Plus className="h-4 w-4" />
                {isPiutang
                  ? dict.debts.detail.recordPaymentButton
                  : dict.debts.detail.payDebtButton}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => openAddTx("pinjaman")}
                className="rounded-full border-hairline font-semibold gap-1.5 h-10 px-4 flex-1 sm:flex-initial bg-card hover:bg-surface-strong"
              >
                <Plus className="h-4 w-4" />
                {dict.debts.detail.addLoanButton}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <HutangTransactionList
        hutang={hutang}
        rekening={rekening}
        onEditTransaction={openEditTx}
        onAddTransaction={openAddTx}
        onSuccess={setHutang}
      />

      {/* Transaction Dialog */}
      <HutangTransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        hutang={hutang}
        rekening={rekening}
        editData={editTxData}
        defaultJenis={defaultTxJenis}
        totalPinjaman={totalPinjaman}
        onSuccess={setHutang}
      />

      {/* Contact Edit Dialog */}
      <HutangContactEditDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        hutang={hutang}
        onSuccess={setHutang}
      />
    </div>
  );
}
