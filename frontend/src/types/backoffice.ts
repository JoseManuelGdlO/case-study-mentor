export type BackofficeCaseDistributionArea = {
  areaId: string;
  areaName: string;
  totalCases: number;
  publishedCases: number;
};

export type BackofficeCaseDistributionRow = {
  specialtyId: string;
  specialtyName: string;
  totalCases: number;
  publishedCases: number;
  areas: BackofficeCaseDistributionArea[];
};

export type BackofficeStats = {
  totalUsers: number;
  totalExams: number;
  totalCases: number;
  totalPublishedCases: number;
  totalQuestions: number;
  caseDistribution: BackofficeCaseDistributionRow[];
  activeUsers: number;
  freeUsers: number;
  monthlySubscribers: number;
  semesterSubscribers: number;
  annualSubscribers: number;
  estimatedRevenue: number;
  avgAccuracy: number;
  abandonRate: number;
};
