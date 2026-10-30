import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/use-translation";

type TransaksiDialogHeaderProps = {
  isCorrection: boolean;
  isEdit: boolean;
  isCopy: boolean;
};

export function TransaksiDialogHeader({
  isCorrection,
  isEdit,
  isCopy,
}: TransaksiDialogHeaderProps) {
  const { dict } = useTranslation();

  const title = isCorrection
    ? dict.transactions.form.editCorrectionTitle
    : isEdit
      ? dict.transactions.form.editTitle
      : isCopy
        ? dict.transactions.form.copyTitle
        : dict.transactions.form.createTitle;

  const description = isCorrection
    ? dict.transactions.form.editCorrectionDescription
    : isEdit
      ? dict.transactions.form.editDescription
      : isCopy
        ? dict.transactions.form.copyDescription
        : dict.transactions.form.createDescription;

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );
}
