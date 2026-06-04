"use client";

import { useMemo, useState } from "react";
import { LeftPanel } from "./left-panel";
import { RightPanel } from "./right-panel";
import type { ApiResponse, PanelState, SynthesizePayload } from "./casedepth-types";

type FetchJsonError = {
  name: "HTTP_ERROR" | "TIMEOUT" | "NETWORK_ERROR" | "INVALID_JSON";
  message: string;
  status?: number;
};

function isAbortError(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

async function fetchJson<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err: FetchJsonError = {
        name: "HTTP_ERROR",
        message: `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
        status: res.status,
      };
      throw err;
    }

    try {
      return (await res.json()) as T;
    } catch {
      const err: FetchJsonError = {
        name: "INVALID_JSON",
        message: "Response was not valid JSON.",
      };
      throw err;
    }
  } catch (e: unknown) {
    if (isAbortError(e)) {
      const err: FetchJsonError = {
        name: "TIMEOUT",
        message: `Request timed out after ${timeoutMs}ms`,
      };
      throw err;
    }

    if (typeof e === "object" && e && "name" in e && "message" in e) {
      throw e;
    }

    const err: FetchJsonError = {
      name: "NETWORK_ERROR",
      message:
        "Network error / Failed to fetch (check URL, CORS, HTTPS/HTTP, VPN/Proxy).",
    };
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export function AppShell() {
  const [currentState, setCurrentState] = useState<PanelState>("IDLE");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = currentState === "PROCESSING";

  const API_BASE = useMemo(() => {
    return (process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000").replace(
      /\/$/,
      ""
    );
  }, []);

  const handleSynthesize = async (payload: SynthesizePayload) => {
    setCurrentState("PROCESSING");
    setApiResponse(null);
    setErrorMessage(null);

    try {
      const data = await fetchJson<ApiResponse>(
        `${API_BASE}/api/synthesize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        60_000
      );

      if (data?.status === "SUCCESS") {
        setApiResponse(data);
        setCurrentState("SUCCESS");
        return;
      }

      if (data?.status === "NEEDS_INFO") {
        setApiResponse(data);
        setCurrentState("NEEDS_INFO");
        return;
      }

      throw {
        name: "INVALID_JSON",
        message: "Invalid response shape (missing/unknown status).",
      } satisfies FetchJsonError;
    } catch (e: any) {
      console.error("SYNTHESIZE ERROR:", e);
      setErrorMessage(e?.message ?? "Unknown error");
      setCurrentState("ERROR");
    }
  };

  const handleFinalize = async (answers: string[]) => {
    setCurrentState("PROCESSING");
    setErrorMessage(null);

    try {
      const data = await fetchJson<ApiResponse>(
        `${API_BASE}/api/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        },
        60_000
      );

      if (data?.status === "SUCCESS") {
        setApiResponse(data);
        setCurrentState("FINAL_RESULT");
        return;
      }

      throw {
        name: "INVALID_JSON",
        message: "Invalid response shape from finalize.",
      } satisfies FetchJsonError;
    } catch (e: any) {
      console.error("FINALIZE ERROR:", e);
      setErrorMessage(e?.message ?? "Unknown error");
      setCurrentState("ERROR");
    }
  };

  const handleReset = () => {
    setApiResponse(null);
    setErrorMessage(null);
    setCurrentState("IDLE");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="mb-4 border-b border-slate-200 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                CaseDepth
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Elevating Raw Intel to Strategic Assets
              </p>
              {/* <p className="mt-1 text-xs text-slate-500">API: {API_BASE}</p> */}
            </div>

            <button
              onClick={handleReset}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          {currentState === "ERROR" && errorMessage && (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {errorMessage}
            </div>
          )}
        </header>

        <section className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <LeftPanel onSynthesize={handleSynthesize} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-7">
            <RightPanel
              currentState={currentState}
              data={apiResponse}
              isLoading={isLoading}
              onSubmitGaps={handleFinalize}
              errorMessage={errorMessage}
              onReset={handleReset}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
