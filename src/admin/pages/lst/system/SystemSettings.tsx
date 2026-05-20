import { useState } from "react";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
  </div>
);

const SystemSettings = () => {
  // サイト全般
  const [siteName, setSiteName] = useState("LST 運営管理");
  const [contactEmail, setContactEmail] = useState("support@lst.example.jp");
  const [supportPhone, setSupportPhone] = useState("03-1234-5678");

  // メンテナンス
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "メンテナンス中です。ご不便をおかけし申し訳ございません。",
  );

  // セキュリティ
  const [sessionExpiry, setSessionExpiry] = useState("2h");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [minPasswordLen, setMinPasswordLen] = useState(8);

  // 言語・地域
  const [defaultLang, setDefaultLang] = useState("ja");
  const [timezone, setTimezone] = useState("Asia/Tokyo");

  const handleSave = () => {
    toast.success("設定を保存しました");
  };

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="システム設定"
        description="プラットフォーム全体の設定"
      />

      <div className="grid gap-4">
        {/* サイト全般 */}
        <div className={cardCls}>
          <SectionTitle title="サイト全般" description="サイト名や問い合わせ先など、基本情報を管理します" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site-name">サイト名</Label>
              <Input
                id="site-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">お問い合わせメール</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-phone">サポート電話番号</Label>
              <Input
                id="support-phone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* メンテナンス */}
        <div className={cardCls}>
          <SectionTitle title="メンテナンス" description="メンテナンスモードと予告メッセージを設定します" />
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">メンテナンスモード</div>
                <div className="text-xs text-slate-500">
                  有効にするとサイト全体がメンテナンスページに切り替わります
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                aria-label="メンテナンスモード"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maint-msg">メンテナンス予告メッセージ</Label>
              <Textarea
                id="maint-msg"
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* セキュリティ */}
        <div className={cardCls}>
          <SectionTitle title="セキュリティ" description="セッション・認証・パスワードに関する設定" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="session-expiry">ログインセッション有効期限</Label>
              <Select value={sessionExpiry} onValueChange={setSessionExpiry}>
                <SelectTrigger id="session-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30m">30分</SelectItem>
                  <SelectItem value="2h">2時間</SelectItem>
                  <SelectItem value="1d">1日</SelectItem>
                  <SelectItem value="1w">1週間</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-pw">パスワード最低文字数</Label>
              <Input
                id="min-pw"
                type="number"
                min={4}
                max={32}
                value={minPasswordLen}
                onChange={(e) => setMinPasswordLen(Number(e.target.value) || 8)}
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">二段階認証必須</div>
                <div className="text-xs text-slate-500">
                  管理者ログイン時にワンタイムコードを要求します
                </div>
              </div>
              <Switch
                checked={twoFactorRequired}
                onCheckedChange={setTwoFactorRequired}
                aria-label="二段階認証必須"
              />
            </div>
          </div>
        </div>

        {/* 言語・地域 */}
        <div className={cardCls}>
          <SectionTitle title="言語・地域" description="デフォルト言語とタイムゾーンを設定します" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="default-lang">デフォルト言語</Label>
              <Select value={defaultLang} onValueChange={setDefaultLang}>
                <SelectTrigger id="default-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">タイムゾーン</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  <SelectItem value="Asia/Taipei">Asia/Taipei</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            設定を保存
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
