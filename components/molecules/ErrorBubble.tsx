'use client';

import { AlertCircle, AlertTriangle } from "lucide-react";
import { getErrorMessage, ErrorCode } from "@/lib/errors";
import { useIntl } from "@/components/providers/IntlProvider";
import { cn } from "@/lib/utils";

type Props = {
  code: ErrorCode;
  details?: string;
  className?: string;
  onAction?: () => void;
};

export default function ErrorBubble({ code, details, className, onAction }: Props) {
  const { language } = useIntl();
  const content = getErrorMessage(code, language);

  const isWarning = content.severity === "warning" || content.severity === "info";
  const Icon = isWarning ? AlertTriangle : AlertCircle;

  return (
    <div
      className={cn(
        "w-full rounded-xl border px-4 py-3 flex items-start gap-3 shadow-sm",
        isWarning ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-900",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isWarning ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{content.title}</p>
        <p className="text-sm leading-relaxed opacity-90">{content.description}</p>
        {details && (
          <p className="text-xs opacity-80 break-words">
            {details}
          </p>
        )}
        {onAction && content.actionLabel && (
          <button
            onClick={onAction}
            className={cn(
              "mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              isWarning
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-red-600 text-white hover:bg-red-700"
            )}
          >
            {content.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
