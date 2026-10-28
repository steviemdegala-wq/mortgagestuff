export const PIPELINE_STAGES = ["New Lead", "Pre-Qualified", "Application", "Processing", "Underwriting", "Closing", "Funded"];
export function validLoanStage(stage: unknown): stage is string | null {
  return stage === null || (typeof stage === "string" && PIPELINE_STAGES.includes(stage));
}
