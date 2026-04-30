"use client";

import { useState } from "react";
import type { Kategori } from "@/types/transaksi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { User, Palette, Tags, Download, Moon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  kategori: Kategori[];
  profile: any;
};

export default function SettingsPageClient({ kategori, profile }: Props) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.name ?? "");

  const systemKat = kategori.filter((k) => k.is_system);
  const customKat = kategori.filter((k) => !k.is_system);

  async function handleExportCSV() {
    toast.info("Fitur export sedang dalam pengembangan");
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm">
          Kelola preferensi dan konfigurasi aplikasi
        </p>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="profil" className="gap-1.5 text-xs">
            <User className="h-3.5 w-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="tampilan" className="gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" /> Tampilan
          </TabsTrigger>
          <TabsTrigger value="kategori" className="gap-1.5 text-xs">
            <Tags className="h-3.5 w-3.5" /> Kategori
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profil" className="mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Informasi Profil</h2>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="profil-email">Email</Label>
                <Input
                  id="profil-email"
                  value={profile?.email ?? "–"}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profil-name">Nama</Label>
                <Input
                  id="profil-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                />
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={() => toast.info("Fitur update profil segera hadir")}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tampilan Tab */}
        <TabsContent value="tampilan" className="mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Tampilan</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" /> Mode Gelap
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aktifkan tampilan dark mode
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                id="dark-mode-switch"
              />
            </div>
          </div>
        </TabsContent>

        {/* Kategori Tab */}
        <TabsContent value="kategori" className="mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Manajemen Kategori</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info("Form tambah kategori segera hadir")}
              >
                + Tambah
              </Button>
            </div>
            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Kategori Sistem
              </p>
              <div className="flex flex-wrap gap-2">
                {systemKat.map((k) => (
                  <Badge key={k.id} variant="secondary" className="gap-1.5">
                    <span>{k.ikon}</span>
                    <span>{k.nama}</span>
                    <span className="text-muted-foreground text-xs">
                      ({k.tipe})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            {customKat.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Kategori Kustom
                </p>
                <div className="flex flex-wrap gap-2">
                  {customKat.map((k) => (
                    <Badge
                      key={k.id}
                      style={{ background: k.warna + "20", color: k.warna }}
                      className="gap-1.5 border-0"
                    >
                      <span>{k.ikon}</span>
                      <span>{k.nama}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Export Data</h2>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Unduh semua data transaksi Anda dalam format CSV atau Excel untuk
              analisis lebih lanjut.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
