'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateUserPreferences } from '@/actions/preference-action';
import { toast } from 'sonner';

interface DarkmodeToggleProps {
  initialTheme?: string;
}

export function DarkmodeToggle({ initialTheme }: DarkmodeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (initialTheme && theme !== initialTheme) {
        setTheme(initialTheme);
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);

    try {
      const res = await updateUserPreferences({ theme: newTheme });
      if (!res.success) {
        if (res.error !== 'Tidak terautentikasi') {
          toast.error(res.error || 'Gagal menyimpan preferensi tema');
        }
      }
    } catch (err) {
      console.error('Error updating theme preference:', err);
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        disabled
        className="w-9 h-9"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle tema</span>
      </Button>
    );
  }

  const Icon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[theme as 'light' | 'dark' | 'system'] || Sun;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              id="darkmode-toggle"
              className="w-9 h-9"
            >
              <Icon className="h-4 w-4 transition-all" />
              <span className="sr-only">Toggle tema</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Pilih tema</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Terang</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Gelap</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistem</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

