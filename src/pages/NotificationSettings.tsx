import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Switch } from "@/components/ui/switch";

interface SettingItem {
  key: string;
  label: string;
  description: string;
}

const pushSettings: SettingItem[] = [
  { key: "push_booking", label: "予約通知", description: "予約の確認・リマインダー" },
  { key: "push_event", label: "大会通知", description: "大会の更新・結果通知" },
  { key: "push_campaign", label: "キャンペーン通知", description: "お得な情報・キャンペーン" },
  { key: "push_message", label: "メッセージ通知", description: "教練からのメッセージ" },
];

const emailSettings: SettingItem[] = [
  { key: "email_booking", label: "予約確認メール", description: "予約完了時のメール通知" },
  { key: "email_event", label: "大会案内メール", description: "大会に関するメール" },
  { key: "email_campaign", label: "キャンペーンメール", description: "お得な情報のメール配信" },
];

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    push_booking: true,
    push_event: true,
    push_campaign: true,
    push_message: true,
    email_booking: true,
    email_event: false,
    email_campaign: false,
  });

  const toggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSection = (title: string, items: SettingItem[]) => (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">
        {title}
      </h3>
      <div className="bg-card border border-border rounded-[8px] divide-y divide-border">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <Switch checked={settings[item.key]} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <InnerPageLayout title="通知設定" onBack={() => navigate(-1)}>
      <div className="space-y-6 pt-2">
        {renderSection("プッシュ通知", pushSettings)}
        {renderSection("メール通知", emailSettings)}
      </div>
    </InnerPageLayout>
  );
};

export default NotificationSettings;
