import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export type WorkflowStep = {
  key: string;
  label: string;
  status: "done" | "current" | "pending";
  note?: string;
};

type Props = {
  steps: WorkflowStep[];
};

export default function WorkflowTimeline({ steps }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-bold text-slate-700">Workflow Timeline</div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.status === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className={`h-5 w-5 ${step.status === "current" ? "text-cyan-600" : "text-slate-300"}`} />
              )}
              {index < steps.length - 1 ? <div className="mt-1 h-8 w-px bg-slate-200" /> : null}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">{step.label}</div>
              {step.note ? <div className="text-xs text-slate-500">{step.note}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
