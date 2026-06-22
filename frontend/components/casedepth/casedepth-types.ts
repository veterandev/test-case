export type PanelState =
  | "IDLE"
  | "PROCESSING"
  | "USER_REVIEW"
  | "NEEDS_INFO"
  | "FINAL_RESULT"
  | "FINAL_RESULT_AFTER_GAP_FILLED"
  | "ERROR"

export type GapStatus =
  | "Satisfactory"
  | "Partial_Evasive"
  | "Sanity_Warning"

export type SuccessResponse = {
  status: "SUCCESS1"
  content: string
  benchmark_score?: number
  directives?: string[]
}

export type NeedsInfoResponse = {
  status: "NEEDS_INFO"
  session_id: string
  gaps: string[]
}

export type AnswerResponse = {
  status: "ANSWERS"
  session_id: string
  answers: string[]
}

export type UserInfoResp = {
  authenticated: boolean
  user:{
      id: number
      user_name: string
      user_role: string
      avatar: string
  }
}


export type FinalResultResponse = {
  status: "FINAL_RESULT"
  content: string
  benchmark_score?: number
  directives?: string[]
}

export type FinalResultAfterGapFilledResponse = {
  status: "FINAL_RESULT_AFTER_GAP_FILLED"
  session_id: string
  title_or_hook?: string
  outline?: string
  content: string
  gap_status: string
  analysis_summary: string
  warnings?: string
  writer_note?: string
  benchmark_score?: number
  directives?: string[]
}

export type ApiResponse =
  | SuccessResponse
  | NeedsInfoResponse
  | AnswerResponse
  | FinalResultResponse
  | FinalResultAfterGapFilledResponse
  | UserInfoResp
 

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

export type AnswerPayload = {
  rbp: string
}

export type UploadResponse = {
  status: "SUCCESS"
  file_name: string
  file_type: string
  file_path: string
  text_content?: string | null
}
