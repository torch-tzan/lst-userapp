import { useParams, useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin } from "lucide-react";

import { useUserCampaign } from "@/admin/lib/userAppBridge/useUserCampaigns";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = useUserCampaign(id);

  if (!campaign) {
    return (
      <InnerPageLayout title="キャンペーン詳細">
        <div className="flex items-center justify-center pt-20">
          <p className="text-sm text-muted-foreground">キャンペーンが見つかりません</p>
        </div>
      </InnerPageLayout>
    );
  }

  return (
    <InnerPageLayout
      title="キャンペーン詳細"
      ctaLabel={campaign.ctaLabel}
      onCtaClick={campaign.ctaLink ? () => navigate(campaign.ctaLink!, { state: campaign.ctaLink === "/search" ? { area: "広島市中区" } : undefined }) : undefined}
    >
      <div className="space-y-5 -mx-[20px] -mt-6">
        {/* Hero image */}
        <div className="relative">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
        </div>

        <div className="px-[20px] space-y-4">
          {/* Title */}
          <h2 className="text-lg font-bold text-foreground leading-snug">{campaign.title}</h2>

          {/* Meta info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground">{campaign.dateLabel}</span>
            </div>
            {campaign.location && (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">{campaign.location}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Body */}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {campaign.body}
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default CampaignDetail;
