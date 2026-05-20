import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Welcome from "./pages/Welcome.tsx";
import Signup from "./pages/Signup.tsx";
import SignupOtp from "./pages/SignupOtp.tsx";
import SignupSocial from "./pages/SignupSocial.tsx";
import SignupPassword from "./pages/SignupPassword.tsx";
import SignupComplete from "./pages/SignupComplete.tsx";
import SignupLevel from "./pages/SignupLevel.tsx";
import LeagueBoardList from "./pages/league/LeagueBoardList.tsx";
import LeagueBoardNew from "./pages/league/LeagueBoardNew.tsx";
import LeagueBoardDetail from "./pages/league/LeagueBoardDetail.tsx";
import LeagueBoardScore from "./pages/league/LeagueBoardScore.tsx";
import LeagueBoardEdit from "./pages/league/LeagueBoardEdit.tsx";
import Profile from "./pages/Profile.tsx";
import Login from "./pages/Login.tsx";
import Terms from "./pages/Terms.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import CourtDetail from "./pages/CourtDetail.tsx";
import BookingConfirm from "./pages/BookingConfirm.tsx";
import BookingComplete from "./pages/BookingComplete.tsx";
import PaymentMethod from "./pages/PaymentMethod.tsx";
import CreditCardPayment from "./pages/CreditCardPayment.tsx";
import BookingHistory from "./pages/BookingHistory.tsx";
import BookingDetailPage from "./pages/BookingDetail.tsx";
import PastBookings from "./pages/PastBookings.tsx";
import MyPage from "./pages/MyPage.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotificationDetail from "./pages/NotificationDetail.tsx";
import LanguageSettings from "./pages/LanguageSettings.tsx";
import CampaignDetail from "./pages/CampaignDetail.tsx";
import GameHome from "./pages/GameHome.tsx";
import TournamentDetail from "./pages/TournamentDetail.tsx";
import TournamentEntry from "./pages/TournamentEntry.tsx";
import MyResults from "./pages/MyResults.tsx";
import MonthDetail from "./pages/MonthDetail.tsx";
import InviteConfirm from "./pages/InviteConfirm.tsx";
import PointsHistory from "./pages/PointsHistory.tsx";
import ProfileEdit from "./pages/ProfileEdit.tsx";
import Messages from "./pages/Messages.tsx";
import MessageDetail from "./pages/MessageDetail.tsx";
import CoachSearch from "./pages/CoachSearch.tsx";
import CoachDetail from "./pages/CoachDetail.tsx";
import ReviewHistory from "./pages/ReviewHistory.tsx";
import OnlineLesson from "./pages/OnlineLesson.tsx";
import Coupons from "./pages/Coupons.tsx";
import CoachingHistory from "./pages/CoachingHistory.tsx";
import ReviewSubmit from "./pages/ReviewSubmit.tsx";
import ReviewDetail from "./pages/ReviewDetail.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ForgotPasswordOtp from "./pages/ForgotPasswordOtp.tsx";
import ForgotPasswordReset from "./pages/ForgotPasswordReset.tsx";
import ForgotPasswordComplete from "./pages/ForgotPasswordComplete.tsx";
import RelatedSites from "./pages/RelatedSites.tsx";
import PasswordChange from "./pages/PasswordChange.tsx";
import NotificationSettings from "./pages/NotificationSettings.tsx";
import PremiumPlan from "./pages/PremiumPlan.tsx";
import PremiumPaymentConfirm from "./pages/PremiumPaymentConfirm.tsx";
import PremiumWelcome from "./pages/PremiumWelcome.tsx";
import PremiumManage from "./pages/PremiumManage.tsx";
import PremiumPaymentMethod from "./pages/PremiumPaymentMethod.tsx";
import PremiumBillingHistory from "./pages/PremiumBillingHistory.tsx";
import PremiumCancel from "./pages/PremiumCancel.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./admin/components/AdminLayout.tsx";
import AdminLogin from "./admin/pages/AdminLogin.tsx";
import AdminPlaceholder from "./admin/pages/AdminPlaceholder.tsx";
import LstDashboard from "./admin/pages/lst/LstDashboard.tsx";
import LeagueList from "./admin/pages/lst/leagues/LeagueList.tsx";
import LeagueDetail from "./admin/pages/lst/leagues/LeagueDetail.tsx";
import LeagueRankings from "./admin/pages/lst/leagues/LeagueRankings.tsx";
import LeaguePlayerDetail from "./admin/pages/lst/leagues/LeaguePlayerDetail.tsx";
import StoreDashboard from "./admin/pages/store/StoreDashboard.tsx";
import CourtList from "./admin/pages/store/courts/CourtList.tsx";
import CourtDetailAdmin from "./admin/pages/store/courts/CourtDetailAdmin.tsx";
import BookingList from "./admin/pages/store/bookings/BookingList.tsx";
import BookingDetailAdmin from "./admin/pages/store/bookings/BookingDetailAdmin.tsx";
import SalesList from "./admin/pages/store/sales/SalesList.tsx";
import SalesDetail from "./admin/pages/store/sales/SalesDetail.tsx";
import PaymentList from "./admin/pages/store/payments/PaymentList.tsx";
import PaymentDetail from "./admin/pages/store/payments/PaymentDetail.tsx";
import StaffList from "./admin/pages/store/staff/StaffList.tsx";
import StaffDetail from "./admin/pages/store/staff/StaffDetail.tsx";
import ShiftList from "./admin/pages/store/shifts/ShiftList.tsx";
import AnnouncementList from "./admin/pages/store/announcements/AnnouncementList.tsx";
import AnnouncementDetail from "./admin/pages/store/announcements/AnnouncementDetail.tsx";
import CampaignList from "./admin/pages/store/campaigns/CampaignList.tsx";
import CampaignDetailAdmin from "./admin/pages/store/campaigns/CampaignDetailAdmin.tsx";
import AdminProfile from "./admin/pages/store/profile/AdminProfile.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/court/:id" element={<CourtDetail />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/booking/payment" element={<PaymentMethod />} />
          <Route path="/booking/payment/card" element={<CreditCardPayment />} />
          <Route path="/booking/complete" element={<BookingComplete />} />
          <Route path="/bookings" element={<BookingHistory />} />
          <Route path="/booking/detail/:id" element={<BookingDetailPage />} />
          <Route path="/bookings/past" element={<PastBookings />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/game" element={<GameHome />} />
          <Route path="/game/tournament/:id" element={<TournamentDetail />} />
          <Route path="/game/tournament/:id/entry" element={<TournamentEntry />} />
          <Route path="/game/my-results" element={<MyResults />} />
          <Route path="/game/my-results/:yearMonth" element={<MonthDetail />} />
          <Route path="/game/invite/:entryId" element={<InviteConfirm />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<MessageDetail />} />
          <Route path="/online-lesson" element={<OnlineLesson />} />
          <Route path="/coaching-history" element={<CoachingHistory />} />
          <Route path="/coaches" element={<CoachSearch />} />
          <Route path="/coaches/:id" element={<CoachDetail />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/language" element={<LanguageSettings />} />
          <Route path="/points/history" element={<PointsHistory />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/reviews" element={<ReviewHistory />} />
          <Route path="/related-sites" element={<RelatedSites />} />
          <Route path="/password-change" element={<PasswordChange />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/review/submit" element={<ReviewSubmit />} />
          <Route path="/review-detail/:threadId/:msgId" element={<ReviewDetail />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/otp" element={<SignupOtp />} />
          <Route path="/signup/social" element={<SignupSocial />} />
          <Route path="/signup/password" element={<SignupPassword />} />
          <Route path="/signup/complete" element={<SignupComplete />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/otp" element={<ForgotPasswordOtp />} />
          <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
          <Route path="/forgot-password/complete" element={<ForgotPasswordComplete />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/premium/plan" element={<PremiumPlan />} />
          <Route path="/premium/payment-confirm" element={<PremiumPaymentConfirm />} />
          <Route path="/premium/welcome" element={<PremiumWelcome />} />
          <Route path="/premium/manage" element={<PremiumManage />} />
          <Route path="/premium/payment-method" element={<PremiumPaymentMethod />} />
          <Route path="/premium/billing-history" element={<PremiumBillingHistory />} />
          <Route path="/premium/cancel" element={<PremiumCancel />} />
          <Route path="/signup/level" element={<SignupLevel />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/game/league" element={<LeagueBoardList />} />
          <Route path="/game/league/new" element={<LeagueBoardNew />} />
          <Route path="/game/league/:id" element={<LeagueBoardDetail />} />
          <Route path="/game/league/:id/score" element={<LeagueBoardScore />} />
          <Route path="/game/league/:id/edit" element={<LeagueBoardEdit />} />
          {/* Admin backstage */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/lst/dashboard" element={<LstDashboard />} />
          <Route path="/admin/store/dashboard" element={<StoreDashboard />} />
          {/* リーグ管理 — order matters: more-specific paths before /:id */}
          <Route path="/admin/lst/leagues" element={<LeagueList />} />
          <Route path="/admin/lst/leagues/rankings" element={<LeagueRankings />} />
          <Route path="/admin/lst/leagues/players/:userId" element={<LeaguePlayerDetail />} />
          <Route path="/admin/lst/leagues/:id" element={<LeagueDetail />} />
          <Route
            path="/admin/lst/*"
            element={
              <AdminLayout role="lst">
                <AdminPlaceholder />
              </AdminLayout>
            }
          />
          {/* 店舗 — コート管理 + 予約管理（より具体的なパスを wildcard より前に） */}
          <Route path="/admin/store/courts" element={<CourtList />} />
          <Route path="/admin/store/courts/:id" element={<CourtDetailAdmin />} />
          <Route path="/admin/store/bookings" element={<BookingList />} />
          <Route path="/admin/store/bookings/:id" element={<BookingDetailAdmin />} />
          {/* 売上 */}
          <Route path="/admin/store/sales" element={<SalesList />} />
          <Route path="/admin/store/sales/:id" element={<SalesDetail />} />
          {/* 支払い */}
          <Route path="/admin/store/payments" element={<PaymentList />} />
          <Route path="/admin/store/payments/:id" element={<PaymentDetail />} />
          {/* スタッフ */}
          <Route path="/admin/store/staff" element={<StaffList />} />
          <Route path="/admin/store/staff/:id" element={<StaffDetail />} />
          {/* シフト */}
          <Route path="/admin/store/shifts" element={<ShiftList />} />
          {/* お知らせ */}
          <Route path="/admin/store/announcements" element={<AnnouncementList />} />
          <Route path="/admin/store/announcements/:id" element={<AnnouncementDetail />} />
          {/* キャンペーン */}
          <Route path="/admin/store/campaigns" element={<CampaignList />} />
          <Route path="/admin/store/campaigns/:id" element={<CampaignDetailAdmin />} />
          {/* プロフィール */}
          <Route path="/admin/store/profile" element={<AdminProfile />} />
          <Route
            path="/admin/store/*"
            element={
              <AdminLayout role="store">
                <AdminPlaceholder />
              </AdminLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
