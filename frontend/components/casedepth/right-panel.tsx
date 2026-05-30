"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResponse, PanelState } from "./casedepth-types";

interface RightPanelProps {
  currentState: PanelState;
  data: ApiResponse | null;
  isLoading?: boolean;
  onSubmitGaps: (answers: string[]) => void;
  errorMessage?: string | null;
  onReset?: () => void;
}

export function RightPanel({
  currentState,
  data,
  isLoading = false,
  onSubmitGaps,
  errorMessage,
  onReset,
}: RightPanelProps) {
  return (
    <Card className="h-full min-h-[640px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-slate-900">
              Narrative Architecture
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Synthesized outputs, diagnostic gaps, and final refined narrative.
            </CardDescription>
          </div>

          <StatusBadge currentState={currentState} />
        </div>
      </CardHeader>

      <CardContent className="h-[calc(100%-88px)] p-0">
        <ScrollArea className="h-full">
          <div className="p-5">
            {currentState === "IDLE" && <IdleView />}

            {currentState === "PROCESSING" && <ProcessingView />}

            {currentState === "SUCCESS" && <SuccessView data={data} />}

            {currentState === "NEEDS_INFO" && (
              <NeedsInfoView
                data={data}
                isLoading={isLoading}
                onSubmitGaps={onSubmitGaps}
              />
            )}

            {currentState === "FINAL_RESULT" && <FinalResultView data={data} />}

            {currentState === "ERROR" && <ErrorView message={errorMessage} />}

            {onReset ? (
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={onReset}>
                  Reset
                </Button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ currentState }: { currentState: PanelState }) {
  if (currentState === "IDLE") {
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
        Standby
      </Badge>
    );
  }

  if (currentState === "PROCESSING") {
    return (
      <Badge className="bg-blue-600 text-white hover:bg-blue-600">
        Processing
      </Badge>
    );
  }

  if (currentState === "NEEDS_INFO") {
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
        Needs Info
      </Badge>
    );
  }

  if (currentState === "SUCCESS") {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        Synthesized
      </Badge>
    );
  }

  if (currentState === "FINAL_RESULT") {
    return (
      <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">
        Final Result
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-rose-600 text-white hover:bg-rose-600">
      Error
    </Badge>
  );
}

function IdleView() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center animate-in fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Sparkles className="h-7 w-7 text-slate-600" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">Awaiting Input</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Submit raw text input to generate a structured narrative. If the source is incomplete,
        the system will request diagnostic clarifications before finalization.
      </p>

      <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
        <MiniInfoCard
          icon={<Info className="h-4 w-4 text-slate-600" />}
          title="Structured Output"
          description="Narrative, benchmark score, and refinement directives."
        />
        <MiniInfoCard
          icon={<AlertCircle className="h-4 w-4 text-slate-600" />}
          title="Gap Detection"
          description="Missing critical details are surfaced as targeted questions."
        />
        <MiniInfoCard
          icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />}
          title="Finalization"
          description="Additional answers are integrated into a refined final result."
        />
      </div>
    </div>
  );
}

function ProcessingView() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center animate-in fade-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">Processing Narrative</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
        Running sequential synthesis workflow. This may include quality checks, gap detection,
        and output shaping.
      </p>

      <div className="mt-8 w-full max-w-md space-y-3">
        <ProgressRow label="Parsing source input" active />
        <ProgressRow label="Evaluating completeness" active />
        <ProgressRow label="Generating structured output" active />
      </div>
    </div>
  );
}

function SuccessView({ data }: { data: ApiResponse | null }) {
  if (!data || data.status !== "SUCCESS") {
    return <FallbackEmptyState />;
  }

  const score = data.benchmark_score ?? null;
  const directives = data.directives ?? [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Synthesis Complete
            </h3>
            <p className="mt-1 text-sm text-emerald-900/80">
              A structured narrative has been generated successfully.
            </p>
          </div>
        </div>
      </section>

      <OutputCard title="Generated Narrative" content={data.content} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              Benchmark
            </CardTitle>
            <CardDescription>Relative confidence / quality indicator</CardDescription>
          </CardHeader>
          <CardContent>
            {score !== null ? (
              <BenchmarkMeter value={score} />
            ) : (
              <p className="text-sm text-slate-500">No benchmark score provided.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">Refinement Directives</CardTitle>
            <CardDescription>Recommended improvements and next actions</CardDescription>
          </CardHeader>
          <CardContent>
            {directives.length > 0 ? (
              <ul className="space-y-3">
                {directives.map((directive, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <span className="mr-2 font-semibold text-slate-900">{index + 1}.</span>
                    {directive}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No directives returned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinalResultView({ data }: { data: ApiResponse | null }) {
  if (!data || data.status !== "SUCCESS") {
    return <FallbackEmptyState />;
  }

  const score = data.benchmark_score ?? null;
  const directives = data.directives ?? [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">
              Final Narrative Ready
            </h3>
            <p className="mt-1 text-sm text-emerald-900/80">
              Diagnostic gaps were bridged and the refined narrative is now available.
            </p>
          </div>
        </div>
      </section>

      <OutputCard title="Final Refined Narrative" content={data.content} highlight />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              Final Benchmark
            </CardTitle>
            <CardDescription>Post-clarification quality indicator</CardDescription>
          </CardHeader>
          <CardContent>
            {score !== null ? (
              <BenchmarkMeter value={score} />
            ) : (
              <p className="text-sm text-slate-500">No benchmark score provided.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">Completion Notes</CardTitle>
            <CardDescription>Final workflow notes and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {directives.length > 0 ? (
              <ul className="space-y-3">
                {directives.map((directive, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <span className="mr-2 font-semibold text-slate-900">{index + 1}.</span>
                    {directive}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No completion notes returned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NeedsInfoView({
  data,
  isLoading,
  onSubmitGaps,
}: {
  data: ApiResponse | null;
  isLoading?: boolean;
  onSubmitGaps: (answers: string[]) => void;
}) {
  const gaps = useMemo(() => {
    if (!data || data.status !== "NEEDS_INFO") return [];
    return data.gaps ?? [];
  }, [data]);

  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    setAnswers(gaps.map(() => ""));
  }, [gaps]);

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const isComplete =
    gaps.length > 0 &&
    answers.length === gaps.length &&
    answers.every((answer) => answer.trim().length > 0);

  const handleSubmit = () => {
    if (!isComplete) {
      alert("Please answer all diagnostic questions before continuing.");
      return;
    }
    onSubmitGaps(answers);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Additional Input Required
            </h3>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">
              The source material appears incomplete. Please answer the following questions to
              improve output quality and finalize the narrative.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Diagnostic Questions</CardTitle>
          <CardDescription>
            Provide concise but sufficient detail for each requested clarification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gaps.length === 0 ? (
            <p className="text-sm text-slate-500">No diagnostic questions were received.</p>
          ) : (
            gaps.map((gap, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-slate-800">
                  {index + 1}. {gap}
                </label>
                <Textarea
                  value={answers[index] ?? ""}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Provide your answer..."
                  className="min-h-[110px] border-slate-300 text-sm"
                  disabled={isLoading}
                />
              </div>
            ))
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!isComplete || isLoading}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Bridge Gaps & Finalize
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OutputCard({
  title,
  content,
  highlight = false,
}: {
  title: string;
  content: string;
  highlight?: boolean;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Copied to clipboard.");
    } catch (error) {
      console.error(error);
      alert("Copy failed.");
    }
  };

  return (
    <Card
      className={
        highlight ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-900">{title}</CardTitle>
            <CardDescription>
              Generated textual output from the synthesis pipeline
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-slate-200"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkMeter({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(100, value));

  const colorClass =
    normalized >= 85
      ? "bg-emerald-600"
      : normalized >= 70
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <span className="text-sm text-slate-600">Score</span>
        <span className="text-2xl font-semibold tracking-tight text-slate-900">
          {normalized}
          <span className="ml-1 text-base text-slate-500">/100</span>
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${normalized}%` }}
        />
      </div>

      <p className="text-xs text-slate-500">
        Higher scores indicate stronger alignment and completeness.
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      {active ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : (
        <div className="h-4 w-4 rounded-full bg-slate-300" />
      )}

      <span className="text-sm text-slate-700">{label}</span>
    </div>
  );
}

function MiniInfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
    </div>
  );
}

function FallbackEmptyState() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Info className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">No output available</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        The current state does not contain renderable output. Please rerun the workflow.
      </p>
    </div>
  );
}

function ErrorView({ message }: { message: string | null | undefined }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center animate-in fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
        <AlertCircle className="h-8 w-8 text-rose-600" />
      </div>
      <h3 className="text-lg font-semibold text-rose-900">Operation Failed</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-rose-700">
        {message || "An unexpected error occurred while communicating with the server."}
      </p>
    </div>
  );
}
