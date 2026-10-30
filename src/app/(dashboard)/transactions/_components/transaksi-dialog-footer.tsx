import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";

type TransaksiDialogFooterProps = {
  isEdit: boolean;
  isCorrection: boolean;
  copying: boolean;
  submitting: boolean;
  disabled: boolean;
  onCopy: () => void;
  onCancel: () => void;
};

export function TransaksiDialogFooter({
  isEdit,
  isCorrection,
  copying,
  submitting,
  disabled,
  onCopy,
  onCancel,
}: TransaksiDialogFooterProps) {
  const { dict } = useTranslation();
  const showCopyButton = isEdit && !isCorrection;

  return (
    <DialogFooter
      className={cn(
        "grid gap-2 sm:flex sm:items-center",
        showCopyButton ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {showCopyButton && (
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          disabled={copying}
          className="w-full gap-1.5 rounded-full border-primary/20 text-primary hover:bg-primary/5 sm:mr-auto sm:w-auto"
        >
          {copying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {dict.common.copy}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="w-full rounded-full sm:w-auto"
      >
        {dict.common.cancel}
      </Button>

      <Button
        type="submit"
        disabled={disabled || submitting}
        className="h-11 w-full rounded-full bg-primary px-3 text-white hover:bg-primary-active sm:w-auto sm:px-5"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isEdit ? dict.common.update : dict.common.save}
      </Button>
    </DialogFooter>
  );
}
