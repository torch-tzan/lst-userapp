import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CsvExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KIND_FILTERS = [
  { value: "court", label: "コート予約" },
  { value: "coach", label: "コーチング" },
  { value: "tournament", label: "大会" },
  { value: "other", label: "その他" },
];

const CsvExportDialog = ({ open, onOpenChange }: CsvExportDialogProps) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(
    new Set(KIND_FILTERS.map((k) => k.value)),
  );

  useEffect(() => {
    if (open) {
      setFrom("");
      setTo("");
      setSelectedKinds(new Set(KIND_FILTERS.map((k) => k.value)));
    }
  }, [open]);

  const toggleKind = (v: string) => {
    const next = new Set(selectedKinds);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSelectedKinds(next);
  };

  const handleDownload = () => {
    toast.success("CSVをダウンロードしました（mock）");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>CSVエクスポート</AdminDialogTitle>
          <AdminDialogDescription>
            指定した期間・種別の取引を CSV ダウンロードします。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="csv-from">開始日</Label>
              <Input
                id="csv-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csv-to">終了日</Label>
              <Input
                id="csv-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>種別フィルタ</Label>
            <div className="grid grid-cols-2 gap-2">
              {KIND_FILTERS.map((k) => (
                <label
                  key={k.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Checkbox
                    checked={selectedKinds.has(k.value)}
                    onCheckedChange={() => toggleKind(k.value)}
                  />
                  <span>{k.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            戻る
          </Button>
          <Button onClick={handleDownload}>ダウンロード</Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CsvExportDialog;
