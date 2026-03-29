import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, BackofficeRoute, AdminRoute } from "@/components/ProtectedRoute";
import { ApiSlowLoadingOverlay } from "@/components/ApiSlowLoadingOverlay";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import NewExam from "./pages/NewExam";
import ExamList from "./pages/ExamList";
import ExamSimulation from "./pages/ExamSimulation";
import ExamStudy from "./pages/ExamStudy";
import Results from "./pages/Results";
import Statistics from "./pages/Statistics";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import CaseList from "./pages/CaseList";
import CaseEditor from "./pages/CaseEditor";
import StudentLayout from "./components/StudentLayout";
import BackofficeLayout from "./components/BackofficeLayout";
import BackofficeDashboard from "./pages/backoffice/BackofficeDashboard";
import UserManagement from "./pages/backoffice/UserManagement";
import PricingConfig from "./pages/backoffice/PricingConfig";
import SpecialtyManagement from "./pages/backoffice/SpecialtyManagement";
import SystemStats from "./pages/backoffice/SystemStats";
import PhrasesManagement from "./pages/backoffice/PhrasesManagement";
import ExamDatesManagement from "./pages/backoffice/ExamDatesManagement";
import BulkUploadCases from "./pages/backoffice/BulkUploadCases";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <TooltipProvider>
          <ApiSlowLoadingOverlay />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
              <Route path="/terminos" element={<TermsOfService />} />
              <Route path="/privacidad" element={<PrivacyPolicy />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="exams" element={<ExamList />} />
                <Route path="new-exam" element={<NewExam />} />
                <Route path="stats" element={<Statistics />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route
                path="/exam/:examId/simulation"
                element={
                  <ProtectedRoute>
                    <ExamSimulation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/study"
                element={
                  <ProtectedRoute>
                    <ExamStudy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:examId"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/backoffice"
                element={
                  <BackofficeRoute>
                    <BackofficeLayout />
                  </BackofficeRoute>
                }
              >
                <Route
                  index
                  element={
                    <AdminRoute>
                      <BackofficeDashboard />
                    </AdminRoute>
                  }
                />
                <Route path="cases" element={<CaseList />} />
                <Route path="cases/new" element={<CaseEditor />} />
                <Route
                  path="cases/bulk-upload"
                  element={
                    <AdminRoute>
                      <BulkUploadCases />
                    </AdminRoute>
                  }
                />
                <Route path="cases/:caseId" element={<CaseEditor />} />
                <Route
                  path="specialties"
                  element={
                    <AdminRoute>
                      <SpecialtyManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="pricing"
                  element={
                    <AdminRoute>
                      <PricingConfig />
                    </AdminRoute>
                  }
                />
                <Route
                  path="stats"
                  element={
                    <AdminRoute>
                      <SystemStats />
                    </AdminRoute>
                  }
                />
                <Route
                  path="phrases"
                  element={
                    <AdminRoute>
                      <PhrasesManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="exam-dates"
                  element={
                    <AdminRoute>
                      <ExamDatesManagement />
                    </AdminRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
