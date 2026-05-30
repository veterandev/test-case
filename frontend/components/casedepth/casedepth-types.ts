export type PanelState =
  | "IDLE"
  | "PROCESSING"
  | "SUCCESS"
  | "NEEDS_INFO"
  | "FINAL_RESULT"
  | "ERROR";

export type SuccessResponse = {
  status: "SUCCESS";
  content: string;
  benchmark_score?: number;
  directives?: string[];
};

export type NeedsInfoResponse = {
  status: "NEEDS_INFO";
  gaps: string[];
};

export type ApiResponse = SuccessResponse | NeedsInfoResponse;

export type SynthesizePayload = {
  text: string;
  format?: string;
};
