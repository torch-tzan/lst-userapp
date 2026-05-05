import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";

const GameHome = () => (
  <PhoneMockup bottomNav={<BottomNav active={2} />}>
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      準備中
    </div>
  </PhoneMockup>
);

export default GameHome;
