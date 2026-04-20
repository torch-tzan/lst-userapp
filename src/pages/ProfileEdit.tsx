import { useState } from "react";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Separator } from "@/components/ui/separator";
import AvatarUpload from "@/components/profile/AvatarUpload";
import EmailChangeDialog from "@/components/profile/EmailChangeDialog";
import { useUserProfile } from "@/lib/userProfileStore";
import { toast } from "sonner";

const ProfileEdit = () => {
  const { profile, updateProfile } = useUserProfile();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [showEmailChange, setShowEmailChange] = useState(false);

  const handleSave = () => {
    updateProfile({ name, phone });
    toast.success("プロフィールを更新しました");
  };

  return (
    <InnerPageLayout
      title="プロフィール編集"
      ctaLabel="保存する"
      onCtaClick={handleSave}
    >
      <div className="-mt-2">
        <AvatarUpload
          avatarPreview={profile.avatar}
          onAvatarChange={(avatar) => updateProfile({ avatar })}
        />

        <Separator className="mb-5" />

        {/* Name */}
        <div className="mb-5">
          <label className="text-sm font-bold text-foreground mb-1.5 block">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-[8px] border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="text-sm font-bold text-foreground mb-1.5 block">メールアドレス</label>
          <div className="flex gap-2">
            <div className="flex-1 h-12 px-4 rounded-[8px] border border-border bg-muted/30 text-sm flex items-center text-foreground">
              {profile.email}
            </div>
            <button
              onClick={() => setShowEmailChange(true)}
              className="h-12 px-4 rounded-[4px] border border-primary text-primary text-xs font-bold hover:bg-primary/5 transition-colors flex-shrink-0"
            >
              変更する
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <label className="text-sm font-bold text-foreground mb-1.5 block">電話番号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 px-4 rounded-[8px] border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <EmailChangeDialog
        email={profile.email}
        onEmailChanged={(newEmail) => updateProfile({ email: newEmail })}
        open={showEmailChange}
        onClose={() => setShowEmailChange(false)}
      />
    </InnerPageLayout>
  );
};

export default ProfileEdit;
