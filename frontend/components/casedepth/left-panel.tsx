"use client";

import { useMemo, useState } from "react";
import { WandSparkles, Upload, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SynthesizePayload } from "./casedepth-types";

interface LeftPanelProps {
  onSynthesize: (payload: SynthesizePayload) => void | Promise<void>;
  isLoading: boolean;
}

export function LeftPanel({ onSynthesize, isLoading }: LeftPanelProps) {
  // State برای تمام اقلام اطلاعاتی
  const [text, setText] = useState("");
  const [format, setFormat] = useState("LinkedIn Post");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [ndaLevel, setNdaLevel] = useState("Public");
  const [industry, setIndustry] = useState("");
  const [length, setLength] = useState("Medium");

  const canSubmit = useMemo(() => text.trim().length > 0 && !isLoading, [text, isLoading]);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    // ارسال داده‌ها به بک‌اند
    // نکته: اگر بک‌اند شما فعلاً فقط text و format را می‌گیرد, 
    // این مقادیر اضافی مشکلی ایجاد نمی‌کنند و می‌توانید بعداً در بک‌اند پردازششان کنید.
    await onSynthesize({ 
      text: text.trim(), 
      format,
      // @ts-ignore - این فیلدها را برای توسعه آینده اضافه می‌کنیم
      metadata: {
        targetAudience,
        tone,
        ndaLevel,
        industry,
        length
      }
    });
  };

  return (
    <Card className="h-full border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl text-slate-900">Intel Intake</CardTitle>
            <CardDescription>
              Input and baseline narrative parameters for the current case.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white">MVP</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* بخش ورودی متن اصلی */}
        <section className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900">Raw Executive Feed</label>
            <p className="text-xs text-slate-500">Paste source material or type directly.</p>
          </div>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Paste raw executive input here..."
            className="min-h-[180px] resize-y border-slate-300 bg-white" 
            disabled={isLoading} 
          />
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1 justify-start gap-2 text-xs" disabled={isLoading}>
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </Button>
            <Button type="button" variant="outline" className="flex-1 justify-start gap-2 text-xs" disabled={isLoading}>
              <Mic className="h-3.5 w-3.5" />
              Record Audio
            </Button>
          </div>
        </section>

        {/* بخش پارامترهای سنتز */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900">Context & Parameters</label>
            <p className="text-xs text-slate-500">Define narrative framing before synthesis.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Output Format">
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

            <Field label="Tone of Voice">
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
              </select>
            </Field>

            <Field label="Target Audience">
              <Input 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. C-Levels" 
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
                <option>Fully Anonymize</option>
              </select>
            </Field>

            <Field label="Industry">
              <Input 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Optional" 
                className="h-9 text-xs"
                disabled={isLoading}
              />
            </Field>

            <Field label="Output Length">
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
        </section>

        <Button 
          onClick={handleSubmit} 
          disabled={!canSubmit} 
          className="h-11 w-full gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </span>
          ) : (
            <>
              <WandSparkles className="h-4 w-4" />
              Synthesize Narrative
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// کامپوننت کمکی برای نظم دادن به فیلدها
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}
