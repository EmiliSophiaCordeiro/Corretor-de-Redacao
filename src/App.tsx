import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import CookieBanner from "@/components/CookieBanner";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import HistoryPage from "./pages/HistoryPage";
import Challenges from "./pages/Challenges";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import SettingsPage from "./pages/SettingsPage";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import CookiesPolicy from "./pages/legal/Cookies";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<CookiesPolicy />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/studio" element={<Studio />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<Help />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieBanner />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
