import { useState, useRef, TouchEvent } from "react";
import campaignSpring from "@/assets/campaign-spring.webp";
import campaignSummer from "@/assets/campaign-summer.webp";
import campaignTournament from "@/assets/campaign-tournament.webp";

const campaigns = [
  {
    id: 1,
    image: campaignSpring,
    title: "春のキャンペーン開催中",
    subtitle: "初回予約で",
    discount: "10%OFF",
  },
  {
    id: 2,
    image: campaignTournament,
    title: "パデル大会",
    subtitle: "チームで戦おう！ランキングに挑戦",
    discount: "",
  },
  {
    id: 3,
    image: campaignSummer,
    title: "夏季トーナメント",
    subtitle: "参加者募集中",
    discount: "エントリー受付中",
  },
];

const CARD_GAP = 4;
const PEEK_WIDTH = 20;

const CampaignCarousel = ({ onViewAll }: { onViewAll?: () => void }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && current < campaigns.length - 1) {
        setCurrent(current + 1);
      } else if (diff < 0 && current > 0) {
        setCurrent(current - 1);
      }
    }
  };

  // Each card width = container - 2 * peek
  // translateX = current * (cardWidth + gap)
  // We use calc for responsive sizing
  const cardWidth = `calc(100% - ${PEEK_WIDTH * 2}px)`;
  const translateX = `calc(-${current} * (100% - ${PEEK_WIDTH * 2}px + ${CARD_GAP}px) + ${PEEK_WIDTH}px)`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-[20px]">
        <h3 className="text-base font-bold text-foreground">キャンペーン情報</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-primary font-medium">すべて見る</button>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300"
          style={{
            gap: `${CARD_GAP}px`,
            transform: `translateX(${translateX})`,
          }}
        >
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="relative flex-shrink-0"
              style={{ width: cardWidth }}
            >
              <img
                src={c.image}
                alt={c.title}
                className="w-full h-[105px] object-cover rounded-[8px]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-[8px] flex flex-col justify-end p-5">
                <p className="text-primary-foreground font-bold text-lg leading-tight">{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary-foreground/80 text-sm">{c.subtitle}</span>
                  {c.discount && (
                    <span className="bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30 text-primary-foreground text-sm font-bold px-3 py-0.5 rounded-md">
                      {c.discount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-3" style={{ gap: "8px" }}>
        {campaigns.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-border"
            }`}
            style={{ width: "6px", height: "6px" }}
          />
        ))}
      </div>
    </div>
  );
};

export default CampaignCarousel;
