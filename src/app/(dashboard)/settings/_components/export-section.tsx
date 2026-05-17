"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getExportData, getExportCount } from "@/actions/export-action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ExportSection() {
  const [loading, setLoading] = useState<boolean>(false);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [filter, setFilter] = useState<{ dari: string; sampai: string }>({ dari: '', sampai: '' });

  useEffect(() => {
    let ignore = false;

    const fetchCount = async () => {
      const res = await getExportCount();
      if (!ignore && res.success && res.data) {
        setExportCount(res.data.count);
      }
    };

    fetchCount();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleExportPDF() {
    setLoading(true);
    try {
      const exportFilter = filter.dari || filter.sampai 
        ? { dari: filter.dari || undefined, sampai: filter.sampai || undefined }
        : undefined;

      const res = await getExportData(exportFilter);
      if (!res.success || !res.data) {
        toast.error(res.error ?? 'Gagal mengambil data');
        return;
      }
      if (res.data.transaksi.length === 0) {
        toast.info('Tidak ada transaksi untuk diexport');
        return;
      }
      
      const userName = res.data.userName;
      
      const { generatePDF } = await import('@/lib/pdf-generator');
      await generatePDF(res.data.transaksi, res.data.summary, userName);
      toast.success(`PDF berhasil dibuat — ${res.data.transaksi.length} transaksi`);
    } catch (err) {
      toast.error('Gagal membuat PDF');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Data</CardTitle>
        <CardDescription>
          Download laporan transaksi keuangan Anda dalam format PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="dari" className="text-sm font-medium">Dari Tanggal</Label>
              <Input 
                id="dari"
                type="date" 
                className="w-full appearance-none bg-background dark:bg-input/20 border-input"
                value={filter.dari}
                onChange={(e) => setFilter({ ...filter, dari: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="sampai" className="text-sm font-medium">Sampai Tanggal</Label>
              <Input 
                id="sampai"
                type="date" 
                className="w-full appearance-none bg-background dark:bg-input/20 border-input"
                value={filter.sampai}
                onChange={(e) => setFilter({ ...filter, sampai: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Kosongkan untuk export semua transaksi
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1 text-sm border border-border/50">
          <p className="font-medium">
            {exportCount ?? '...'} transaksi siap diexport
          </p>
          <p className="text-muted-foreground">
            Periode: {(filter.dari || filter.sampai) ? `${filter.dari || 'Awal'} – ${filter.sampai || 'Sekarang'}` : 'Semua waktu'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            PDF berisi ringkasan keuangan dan rincian seluruh transaksi.
          </p>
          <Button 
            onClick={handleExportPDF} 
            disabled={loading}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? 'Membuat PDF...' : 'Export PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
