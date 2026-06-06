export type PanelState =
  | "IDLE"
  | "PROCESSING"
  | "SUCCESS"
  | "NEEDS_INFO"
  | "FINAL_RESULT"
  | "FINAL_RESULT_AFTER_GAP_FILLED"
  | "ERROR"

export type GapStatus =
  | "Fully Addressed"
  | "Partial Response"
  | "Sanity Warning"

export type SuccessResponse = {
  status: "SUCCESS"
  content: string
  benchmark_score?: number
  directives?: string[]
}

export type NeedsInfoResponse = {
  status: "NEEDS_INFO"
  session_id: string
  gaps: string[]
}

export type FinalResultResponse = {
  status: "FINAL_RESULT"
  content: string
  benchmark_score?: number
  directives?: string[]
}

export type FinalResultAfterGapFilledResponse = {
  status: "FINAL_RESULT_AFTER_GAP_FILLED"
  content: string
  benchmark_score?: number
  directives?: string[]
  editorial_brief?: string
  gap_status?: GapStatus[]
}

export type ApiResponse =
  | SuccessResponse
  | NeedsInfoResponse
  | FinalResultResponse
  | FinalResultAfterGapFilledResponse

export type SynthesizePayload = {
  text: string
  format?: string
  metadata?: {
    targetAudience?: string
    tone?: string
    ndaLevel?: string
    industry?: string
    length?: string
  }
}

export type UploadResponse = {
  status: "SUCCESS"
  file_name: string
  file_type: string
  file_path: string
  text_content?: string | null
}
