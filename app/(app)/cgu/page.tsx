"use client";

import { useTranslations } from "@/components/providers/IntlProvider";

export default function CguPage() {
  const legalT = useTranslations("legal");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-4xl flex-col gap-6 px-6 py-12 text-foreground">
      <h1 className="text-3xl font-bold">{legalT("cguTitle")}</h1>
      <p className="text-muted-foreground leading-relaxed">{legalT("cguIntro")}</p>
    </div>
  );
}
