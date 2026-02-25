export interface CompetencyScore {
  score: number;
  justification: string;
}

export interface SpecificError {
  type: string;
  location: string;
  technical_description: string;
  inep_rule: string;
  level_impact: string;
}

export interface C5Checklist {
  agent: boolean;
  action: boolean;
  means_mode: boolean;
  effect: boolean;
  detail: boolean;
}

export interface GradingResult {
  total_score: number;
  competencies: {
    c1: CompetencyScore;
    c2: CompetencyScore;
    c3: CompetencyScore;
    c4: CompetencyScore;
    c5: CompetencyScore;
  };
  specific_errors: SpecificError[];
  c5_checklist: C5Checklist;
  overall_verdict: string;
}
