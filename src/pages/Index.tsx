import logo from "@/assets/logo.webp";
import coachSearchBg from "@/assets/coach-search-bg.webp";
import PhoneMockup from "@/components/PhoneMockup";
import { Bell, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchForm from "@/components/SearchForm";
import CampaignCarousel from "@/components/CampaignCarousel";
import CourtCard from "@/components/CourtCard";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { HOME_COURTS } from "@/lib/courtData";

const Index = () => {
  const navigate = useNavigate();
  const [recentCourts, setRecentCourts] = useState(HOME_COURTS);
  const bottomNav = <BottomNav active={0} />;

  return (
    <PhoneMockup bottomNav={bottomNav}>
      <div className="bg-background pb-4">
        {/* Header */}
        <header className="bg-gray-5 py-3 pb-[152px]">
          <div className="flex items-center justify-between px-[20px]">
            <div className="w-9" />
            <img src={logo} alt="PADEL BASE" style={{ height: 32 }} />
            <button onClick={() => navigate("/notifications")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Search Form */}
        <div className="-mt-[132px] relative z-10">
          <SearchForm />
        </div>

        {/* Coach Search */}
        <div className="mt-6 mx-[20px]">
          <button
            onClick={() => navigate("/coaches")}
            className="w-full rounded-[8px] overflow-hidden relative flex items-stretch text-left h-[88px]"
          >
            {/* Photo background */}
            <img
              src={coachSearchBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-left"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/30 to-foreground/60" />

            {/* Content — right-aligned text */}
            <div className="relative z-10 flex items-center justify-end w-full px-4 gap-2">
              <div className="text-right">
                <h3 className="text-base font-bold text-primary-foreground">コーチを探す</h3>
                <p className="text-xs text-primary-foreground/80 mt-0.5">プロのコーチからレッスンを受けよう</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary-foreground/70 flex-shrink-0" />
            </div>
          </button>
        </div>

        {/* Campaign */}
        <div className="mt-6">
          <CampaignCarousel onViewAll={() => navigate("/game")} />
        </div>

        {/* Recent Courts */}
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between mb-3 px-[20px]">
            <h3 className="text-base font-bold text-foreground">最近見たコート</h3>
            {recentCourts.length > 0 && (
              <button onClick={() => setRecentCourts([])} className="text-xs text-muted-foreground">クリア</button>
            )}
          </div>
          {recentCourts.length > 0 ? (
            <div className="space-y-[12px] px-[20px]">
              {recentCourts.map((court) => (
                <CourtCard key={court.name} {...court} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 px-[20px]">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <p className="text-sm font-bold text-foreground">閲覧履歴はありません</p>
              <p className="text-xs text-muted-foreground text-center">コートを検索して閲覧すると<br/>ここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </PhoneMockup>
  );
};


export default Index;
