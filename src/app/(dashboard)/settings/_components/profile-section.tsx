"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "@/actions/profile-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";

const sanitizeAvatarUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return url;
  if (url.startsWith("data:image/")) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type Props = { profile: Profile | null };

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0 w-full sm:w-64 max-w-full">{children}</div>
    </div>
  );
}

export function ProfileSection({ profile }: Props) {
  const { formatTanggal } = useSystemPreferences();
  const [name, setName] = useState(profile?.name ?? "");
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    sanitizeAvatarUrl(profile?.avatar_url ?? null),
  );
  const [isAvatarPending, setIsAvatarPending] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file tidak valid (hanya JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(sanitizeAvatarUrl(objectUrl));
    setIsAvatarPending(true);

    const fd = new FormData();
    fd.append("avatar", file);

    const res = await uploadAvatar(fd);
    if (res.success && res.data) {
      setAvatarPreview(sanitizeAvatarUrl(res.data.avatar_url));
      toast.success("Avatar berhasil diperbarui");
    } else {
      setAvatarPreview(profile?.avatar_url ?? null);
      toast.error(res.error || "Gagal mengunggah avatar");
    }

    setIsAvatarPending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setIsAvatarPending(true);
    const res = await removeAvatar();
    if (res.success) {
      setAvatarPreview(null);
      toast.success("Avatar berhasil dihapus");
    } else {
      toast.error(res.error || "Gagal menghapus avatar");
    }
    setIsAvatarPending(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      toast.error("Nama harus antara 1 sampai 100 karakter");
      return;
    }

    setIsPending(true);
    const res = await updateProfile({ name: trimmedName });
    setIsPending(false);

    if (res.success) {
      toast.success("Profil berhasil diperbarui");
    } else {
      toast.error(res.error || "Gagal memperbarui profil");
    }
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0]?.toUpperCase() ?? "U");

  const formattedJoinDate = profile?.created_at
    ? formatTanggal(profile.created_at)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
        <CardDescription>
          Kelola informasi publik dan data diri Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center justify-between gap-6 py-4">
          <div>
            <p className="text-sm font-medium">Avatar</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gambar profil Anda
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAvatarPending}
                  className="h-8 text-xs gap-2"
                >
                  {isAvatarPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  Ganti Foto
                </Button>
                {avatarPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isAvatarPending}
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                  >
                    Hapus
                  </Button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-strong flex items-center justify-center text-foreground text-sm font-semibold shrink-0 overflow-hidden relative">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sanitizeAvatarUrl(avatarPreview) ?? undefined}
                  className={`w-full h-full object-cover ${isAvatarPending ? "opacity-50" : ""}`}
                  alt={profile?.name ?? profile?.email ?? "Avatar CatatZ"}
                />
              ) : (
                <span className={isAvatarPending ? "opacity-50" : ""}>
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <SettingRow label="Email" description="Email tidak dapat diubah">
          <Input
            id="profil-email"
            value={profile?.email ?? "–"}
            disabled
            className="bg-surface-soft text-muted-foreground text-sm h-9 rounded-input"
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

        {formattedJoinDate && (
          <>
            <Separator />
            <SettingRow
              label="Tanggal Bergabung"
              description="Sejak akun Anda didaftarkan"
            >
              <Input
                id="profil-created-at"
                value={formattedJoinDate}
                disabled
                className="bg-surface-soft text-muted-foreground text-sm h-9 rounded-input"
              />
            </SettingRow>
          </>
        )}

        <Separator />

        <div className="pt-4 flex justify-end">
          <Button
            className="bg-primary hover:bg-primary-active text-white gap-2 rounded-full h-11 px-5"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
