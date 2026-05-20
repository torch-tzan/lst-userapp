import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { clearAdminAuth, useAdminAuth } from "../lib/adminAuthStore";

type RoleChoice = "lst" | "store-tokyo" | "store-osaka" | "store-yokohama";

const STORE_OPTIONS: Record<Exclude<RoleChoice, "lst">, string> = {
  "store-tokyo": "東京銀座店",
  "store-osaka": "大阪本店",
  "store-yokohama": "横浜駅前店",
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn } = useAdminAuth();

  const [email, setEmail] = useState("admin@example.com");
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
    <div className="flex min-h-screen">
      {/* 左：ダークネイビー × ロゴ */}
      <div className="flex w-1/2 items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500">
              <span className="text-3xl font-bold text-white">A</span>
            </span>
            <span className="ml-4 text-5xl font-bold tracking-wide text-white">ADMIN</span>
          </div>
          <div className="mt-4 text-sm text-slate-400">管理者コンソール</div>
        </div>
      </div>

      {/* 右：白カード */}
      <div className="flex w-1/2 items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-10 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">ログイン</h1>
          <p className="mb-8 text-sm text-gray-500">メールアドレスとパスワードを入力してください</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">メールアドレス</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
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

            <div className="space-y-1.5 pb-2">
              <Label htmlFor="admin-role" className="text-xs text-slate-500">
                ログイン先
              </Label>
              <Select value={roleChoice} onValueChange={(v) => setRoleChoice(v as RoleChoice)}>
                <SelectTrigger id="admin-role" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lst">LST 本部</SelectItem>
                  <SelectItem value="store-tokyo">東京銀座店</SelectItem>
                  <SelectItem value="store-osaka">大阪本店</SelectItem>
                  <SelectItem value="store-yokohama">横浜駅前店</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="mb-4 h-12 w-full bg-blue-500 text-base font-semibold hover:bg-blue-600"
            >
              ログイン
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => toast.info("プロトタイプ: パスワードリセットは未実装")}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                パスワードをお忘れの方
              </button>
            </div>
          </form>
        </div>
      </div>

      <SonnerToaster position="top-right" richColors />
    </div>
  );
};

export default AdminLogin;
