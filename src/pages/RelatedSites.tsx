import { useNavigate } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { MapPin, Globe, List, ExternalLink } from "lucide-react";

interface SiteLink {
  icon: "map" | "globe" | "list";
  title: string;
  description: string;
  url: string;
}

const RELATED_SITES: SiteLink[] = [
  { icon: "map", title: "広島市観光情報", description: "広島市公式観光サイト", url: "https://www.hiroshima-navi.or.jp" },
  { icon: "globe", title: "公式観光サイト", description: "Visit Hiroshima", url: "https://visithiroshima.net" },
  { icon: "list", title: "関連URL一覧", description: "パートナーサイト・提携施設リンク", url: "#" },
  { icon: "globe", title: "日本パデル協会", description: "Japan Padel Association", url: "#" },
  { icon: "map", title: "全国パデルコート一覧", description: "施設検索・アクセス情報", url: "#" },
];

const ICON_MAP = { map: MapPin, globe: Globe, list: List };

const RelatedSites = () => {
  const navigate = useNavigate();

  return (
    <InnerPageLayout title="関連サイト" onBack={() => navigate("/mypage")}>
      <div className="space-y-2">
        <div className="rounded-[8px] border border-border divide-y divide-border overflow-hidden">
          {RELATED_SITES.map((link, idx) => {
            const Icon = ICON_MAP[link.icon];
            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/30 transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default RelatedSites;
