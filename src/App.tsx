import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import Login from "./pages/Login";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Student area */}
          <Route path="/dashboard" element={<StudentLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="exams" element={<ExamList />} />
            <Route path="new-exam" element={<NewExam />} />
            <Route path="stats" element={<Statistics />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Exam views (full screen, no sidebar) */}
          <Route path="/exam/:examId/simulation" element={<ExamSimulation />} />
          <Route path="/exam/:examId/study" element={<ExamStudy />} />
          <Route path="/results/:examId" element={<Results />} />

          {/* Backoffice */}
          <Route path="/backoffice" element={<BackofficeLayout />}>
            <Route index element={<BackofficeDashboard />} />
            <Route path="cases" element={<CaseList />} />
            <Route path="cases/new" element={<CaseEditor />} />
            <Route path="cases/bulk-upload" element={<BulkUploadCases />} />
            <Route path="cases/:caseId" element={<CaseEditor />} />
            <Route path="specialties" element={<SpecialtyManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="pricing" element={<PricingConfig />} />
            <Route path="stats" element={<SystemStats />} />
            <Route path="phrases" element={<PhrasesManagement />} />
            <Route path="exam-dates" element={<ExamDatesManagement />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
