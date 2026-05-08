"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
};

type Props = { profile: Profile | null };

/** Baris setting: label kiri, kontrol kanan — mirip Claude settings */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0 w-52 max-w-full">{children}</div>
    </div>
  );
}

export function ProfilTab({ profile }: Props) {
  const [name, setName] = useState(profile?.name ?? "");

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <div className="space-y-0">
      {/* Section: Profile */}
      <h2 className="text-sm font-semibold text-indigo-500 mb-2">Profil</h2>

      {/* Avatar row */}
      <div className="flex items-center justify-between gap-6 py-4">
        <p className="text-sm font-medium">Avatar</p>
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
              alt={profile.name ?? profile.email}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>

      <Separator />

      <SettingRow label="Email" description="Email tidak dapat diubah">
        <Input
          id="profil-email"
          value={profile?.email ?? "–"}
          disabled
          className="bg-muted text-sm h-9"
        />
      </SettingRow>

      <Separator />

      <SettingRow label="Nama Tampilan">
        <Input
          id="profil-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="text-sm h-9"
        />
      </SettingRow>

      <Separator />

      <div className="pt-4">
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() => toast.info("Fitur update profil segera hadir")}
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
