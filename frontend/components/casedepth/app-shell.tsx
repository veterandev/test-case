"use client"

import { useMemo, useState } from "react"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { ApiResponse, PanelState, SynthesizePayload } from "./casedepth-types"

import DictateButton from "@/components/casedepth/dictatebutton"

import { useEffect } from "react"
import { trackEditorFocus } from "@/lib/utils/editor-focus"

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
  options: RequestInit,
  timeoutMs = 60000
): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...options,
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

export function AppShell() {
  const [currentState, setCurrentState] = useState<PanelState>("IDLE")
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const isLoading = currentState === "PROCESSING"

  const API_BASE = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"
    return base.replace(/\/$/, "")
  }, [])

  async function handleSynthesize(payload: SynthesizePayload) {
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

      if (data.status === "SUCCESS") {
        setApiResponse(data)
        setCurrentState("SUCCESS")
      } else if (data.status === "NEEDS_INFO") {
        setSessionId(data.session_id)
        setApiResponse(data)
        setCurrentState("NEEDS_INFO")
      } else if (data.status === "FINAL_RESULT") {
        setApiResponse(data)
        setCurrentState("FINAL_RESULT")
      } else {
        throw {
          name: "INVALID_JSON",
          message: "Invalid response shape (missing/unknown status).",
        } as FetchJsonError
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Unexpected error")
      setCurrentState("ERROR")
    }
  }

  async function handleFinalize(answers: string[]) {
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
      } else {
        throw {
          name: "INVALID_JSON",
          message: "Invalid response shape from finalize.",
        }
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
    setCurrentState("IDLE")
  }

  useEffect(() => {
    trackEditorFocus()
  }, [])

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

        <button onClick={handleReset}>Reset</button>
      </header>

      {/* فقط این padding-top اضافه شده */}
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
            errorMessage={errorMessage}
            onReset={handleReset}
          />
        </div>

      </div>

    </main>
  )
}
