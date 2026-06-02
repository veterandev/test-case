"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Mic, Square, Upload, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SynthesizePayload, UploadResponse } from "./casedepth-types";

interface LeftPanelProps {
  onSynthesize: (payload: SynthesizePayload) => void | Promise<void>;
  isLoading: boolean;
}

export function LeftPanel({ onSynthesize, isLoading }: LeftPanelProps) {
  const [text, setText] = useState("");
  const [format, setFormat] = useState("LinkedIn Post");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [ndaLevel, setNdaLevel] = useState("Public");
  const [industry, setIndustry] = useState("");
  const [length, setLength] = useState("Medium");

  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = useMemo(
    () => text.trim().length > 0 && !isLoading && !isUploading && !isRecording,
    [text, isLoading, isUploading, isRecording]
  );

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const uploadFileToBackend = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Upload failed: ${res.status} ${res.statusText}${
            errorText ? ` — ${errorText}` : ""
          }`
        );
      }

      const data = (await res.json()) as UploadResponse;

      if (data.text_content) setText(data.text_content);
      else setText(`Uploaded file: ${data.file_name}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileToBackend(file);
    e.target.value = "";
  };

  const handleUploadClick = () => {
    // بدون asChild: خودمان input را کلیک می‌کنیم
    fileInputRef.current?.click();
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/oga" });
      const file = new File([blob], `recording-${Date.now()}.oga`, {
        type: blob.type,
      });

      stream.getTracks().forEach((track) => track.stop());
      await uploadFileToBackend(file);
    };

    recorder.start();
    setIsRecording(true);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    await onSynthesize({
      text: text.trim(),
      format,
      metadata: { targetAudience, tone, ndaLevel, industry, length },
    });
  };

  const disableUpload = isLoading || isUploading || isRecording;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Intel Intake</CardTitle>
            <CardDescription>
              Feed your Raw Executive Intel & Run Synthesizing Narrative …
            </CardDescription>
          </div>
          <Badge variant="secondary">MVP</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Raw Executive Feed</label>
        <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw executive input here..."
            className="min-h-[180px] resize-y border-slate-300 bg-white"
            disabled={isLoading || isUploading}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div>
            <Input
              ref={fileInputRef}
              id="casedepth-file-upload"
              type="file"
              accept=".txt,.json,.csv,.jsonl,audio/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disableUpload}
            />

            <Button
              type="button"
              variant="outline"
              onClick={handleUploadClick}
              disabled={disableUpload}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleRecordToggle}
            disabled={isLoading || isUploading}
          >
            {isRecording ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Record Audio
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Context & Parameters</h3>
            <p className="text-xs text-slate-500">
              Define narrative framing before synthesis.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Format">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option>LinkedIn Post</option>
                <option>Case Study</option>
                <option>Blog Post</option>
                <option>Twitter Thread</option>
              </select>
            </Field>

            <Field label="Tone">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option>Professional</option>
                <option>Conversational</option>
                <option>Witty</option>
                <option>Academic</option>
                <option>Direct/Punchy</option>
                <option>Inspirational</option>
              </select>
            </Field>

            <Field label="Target Audience">
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Financial C-Levels"
                className="h-9 text-xs"
                disabled={isLoading}
              />
            </Field>

            <Field label="NDA Level">
              <select
                value={ndaLevel}
                onChange={(e) => setNdaLevel(e.target.value)}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option>Public</option>
                <option>Anonymize Identity</option>
                <option>Anonymize Identity & Metrics</option>
              </select>
            </Field>

            <Field label="Industry">
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Optional Text"
                className="h-9 text-xs"
                disabled={isLoading}
              />
            </Field>

            <Field label="Length">
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
              </select>
            </Field>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="h-9 w-full">
          <WandSparkles className="mr-2 h-4 w-4" />
          {isLoading ? "Processing..." : "Synthesize Narrative"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
