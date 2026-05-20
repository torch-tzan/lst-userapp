import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { clearAdminAuth, useAdminAuth } from "../lib/adminAuthStore";

type RoleChoice = "lst" | "store-tokyo" | "store-osaka" | "store-yokohama";

const STORE_OPTIONS: Record<Exclude<RoleChoice, "lst">, string> = {
  "store-tokyo": "東京銀座店",
  "store-osaka": "大阪梅田店",
  "store-yokohama": "横浜みなとみらい店",
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn } = useAdminAuth();

  const [email, setEmail] = useState("admin@lst.jp");
  const [password, setPassword] = useState("demo1234");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("lst");

  useEffect(() => {
    clearAdminAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleChoice === "lst") {
      signIn({ role: "lst", email });
      navigate("/admin/lst/dashboard");
    } else {
      signIn({
        role: "store",
        email,
        storeName: STORE_OPTIONS[roleChoice],
      });
      navigate("/admin/store/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-semibold tracking-wide text-white">
            LST Admin
          </div>
          <h1 className="text-xl font-semibold text-slate-900">管理画面ログイン</h1>
          <p className="mt-1 text-sm text-slate-500">アカウント情報とロールを選択してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">メールアドレス</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">パスワード</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-role">ロール / 店舗</Label>
            <Select value={roleChoice} onValueChange={(v) => setRoleChoice(v as RoleChoice)}>
              <SelectTrigger id="admin-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lst">LST 本部 (HQ Admin)</SelectItem>
                <SelectItem value="store-tokyo">店舗 - 東京銀座店</SelectItem>
                <SelectItem value="store-osaka">店舗 - 大阪梅田店</SelectItem>
                <SelectItem value="store-yokohama">店舗 - 横浜みなとみらい店</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            ログイン
          </Button>

          <p className="text-center text-xs text-slate-500">
            プロトタイプ：任意の値でログインできます
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
