"use client"

import { useMemo, useState, useEffect } from "react"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"

import {
  ApiResponse,
  AnswerResponse,
  PanelState,
  SynthesizePayload,
  AnswerPayload,
  UserInfoResp,
} from "./casedepth-types"

import DictateButton from "@/components/casedepth/dictatebutton"
import { trackEditorFocus } from "@/lib/utils/editor-focus"

type UserInfo = {
  name: string
  avatar?: string
  authenticated: boolean
}

type FetchJsonError =
  | { name: "HTTP_ERROR"; message: string; status: number }
  | { name: "TIMEOUT"; message: string }
  | { name: "NETWORK_ERROR"; message: string }
  | { name: "INVALID_JSON"; message: string }

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw {
        name: "HTTP_ERROR",
        message: text || `HTTP ${res.status}`,
        status: res.status,
      } as FetchJsonError
    }

    try {
      return (await res.json()) as T
    } catch {
      throw {
        name: "INVALID_JSON",
        message: "Response is not valid JSON",
      } as FetchJsonError
    }
  } catch (err: any) {
    if (isAbortError(err)) {
      throw { name: "TIMEOUT", message: "Request timed out" } as FetchJsonError
    }
    if (err?.name) throw err
    throw { name: "NETWORK_ERROR", message: "Network error" } as FetchJsonError
  } finally {
    clearTimeout(id)
  }
}

function extractKey(input: string): string {
  const trimmed = input.trim()

  if (!trimmed) return ""

  if (trimmed.includes("key=")) {
    try {
      const url = new URL(trimmed)
      return url.searchParams.get("key")?.trim() ?? ""
    } catch {
      return ""
    }
  }

  return trimmed
}

type LoginModalProps = {
  open: boolean
  value: string
  loading: boolean
  errorMessage: string | null
  onChange: (value: string) => void
  onSubmit: () => void
}

function LoginModal({
  open,
  value,
  loading,
  errorMessage,
  onChange,
  onSubmit,
}: LoginModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold">Login Required</h2>
        <p className="mt-2 text-sm text-gray-600 leading-6">
         Please paste the Qr-Login Link or Only the Key.
        </p>

        <div className="mt-4 space-y-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Example:
                https://domain/auth/qr-login?key=7LIrt3u584
                Or Only:
                7LIrt3u584"
            className="min-h-[120px] w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-black"
          />

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [currentState, setCurrentState] = useState<PanelState>("IDLE")
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [gapAnswers, setGapAnswers] = useState<string[]>([])

  const [user, setUser] = useState<UserInfo>({
    name: "Guest",
    avatar: "/logo.png",
    authenticated: false,
  })

  const [authChecked, setAuthChecked] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginInput, setLoginInput] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const isLoading = currentState === "PROCESSING"

  const API_BASE = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CASEDEPTH_API_BASE || "http://127.0.0.1:8000"
    return base.replace(/\/$/, "")
  }, [])

  async function user_info() {
    setLoginError(null)

    try {
      const data = await fetchJson<UserInfoResp>(`${API_BASE}/auth/me`, {
        method: "GET",
      })

      setUser({
        name: data.user?.user_name ?? "Guest",
        avatar: data.user?.avatar ?? "/logo.png",
        authenticated: data.authenticated,
      })

      setShowLogin(!data.authenticated)
    } catch (err) {
      console.error(err)

      setUser({
        name: "Guest",
        avatar: "/logo.png",
        authenticated: false,
      })

      setShowLogin(true)
    } finally {
      setAuthChecked(true)
    }
  }

  async function user_login(keyOrLink: string) {
    setLoginError(null)

    const key = extractKey(keyOrLink)

    if (!key) {
      setLoginError("Please enter a Key or URL. What you entered has not a correct key.")
      return
    }

    setLoginLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/qr-login?key=${encodeURIComponent(key)}`, {
        method: "GET",
        credentials: "include",
        redirect: "follow",
      })

      if (!res.ok) {
        throw new Error("Login failed")
      }

      await user_info()

      if (user.authenticated) {
        setShowLogin(false)
      } else {
        setShowLogin(false)
      }

      setLoginInput("")
      setLoginError(null)
    } catch (err) {
      console.error(err)
      setLoginError("Login Failed! Please enter a valid key and try again.")
      setShowLogin(true)
    } finally {
      setLoginLoading(false)
    }
  }

  async function ensureAuthenticated(): Promise<boolean> {
    if (user.authenticated) return true

    setErrorMessage("Before using the app, please login first.")
    setCurrentState("ERROR")
    setShowLogin(true)
    return false
  }

  async function handleSynthesize(payload: SynthesizePayload) {
    if (!(await ensureAuthenticated())) return

    setCurrentState("PROCESSING")
    setApiResponse(null)
    setErrorMessage(null)

    try {
      const data = await fetchJson<ApiResponse>(`${API_BASE}/api/synthesize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (data.status === "FINAL_RESULT") {
        setApiResponse(data)
        setCurrentState("FINAL_RESULT")
      } else if (data.status === "NEEDS_INFO") {
        setSessionId(data.session_id)
        setApiResponse(data)
        setGapAnswers((data.gaps ?? []).map(() => ""))
        setCurrentState("NEEDS_INFO")
      } else if (data.status === "FINAL_RESULT_AFTER_GAP_FILLED") {
        setApiResponse(data)
        setCurrentState("FINAL_RESULT_AFTER_GAP_FILLED")
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Unexpected error")
      setCurrentState("ERROR")
    }
  }

  async function handleFinalize(answers: string[]) {
    if (!(await ensureAuthenticated())) return

    setCurrentState("PROCESSING")

    try {
      const data = await fetchJson<ApiResponse>(`${API_BASE}/api/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
        }),
      })

      if (data.status === "FINAL_RESULT_AFTER_GAP_FILLED") {
        setApiResponse(data)
        setCurrentState("FINAL_RESULT_AFTER_GAP_FILLED")
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Unexpected error")
      setCurrentState("ERROR")
    }
  }

  async function handleAnswer(payload: AnswerPayload) {
    if (!(await ensureAuthenticated())) return

    setErrorMessage(null)

    try {
      const data = await fetchJson<AnswerResponse>(`${API_BASE}/api/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          rbp: "Evasive",
        }),
      })

      if (data.status === "ANSWERS") {
        setSessionId(data.session_id)
        setGapAnswers(data.answers ?? [])
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Unexpected error")
      setCurrentState("ERROR")
    }
  }

  function handleReset() {
    setApiResponse(null)
    setErrorMessage(null)
    setSessionId(null)
    setGapAnswers([])
    setCurrentState("IDLE")
  }

  useEffect(() => {
    trackEditorFocus()
    user_info()
  }, [])

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Checking authentication...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b p-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">CaseDepth</h1>
          <p className="text-sm text-muted-foreground">
            Elevating Raw Intel to Strategic Assets
          </p>
        </div>

        <DictateButton />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.name}</span>
            <img
              src={user.avatar || "/logo.png"}
              alt="avatar"
              width={48}
              height={48}
              className="rounded-full border"
            />
          </div>
        </div>
      </header>

      <div className="pt-24 flex flex-col md:flex-row flex-1 gap-4 p-4">
        <div className="w-full md:flex-1">
          <LeftPanel
            onSynthesize={handleSynthesize}
            isLoading={isLoading}
          />
        </div>

        <div className="w-full md:flex-1">
          <RightPanel
            currentState={currentState}
            data={apiResponse}
            isLoading={isLoading}
            onSubmitGaps={handleFinalize}
            onSubmitAnswer={handleAnswer}
            errorMessage={errorMessage}
            onReset={handleReset}
            gapAnswers={gapAnswers}
            setGapAnswers={setGapAnswers}
          />
        </div>
      </div>

      <LoginModal
        open={showLogin}
        value={loginInput}
        loading={loginLoading}
        errorMessage={loginError}
        onChange={setLoginInput}
        onSubmit={() => user_login(loginInput)}
      />
    </main>
  )
}
