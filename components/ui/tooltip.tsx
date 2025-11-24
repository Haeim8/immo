"use client";

import * as React from "react";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <>{children}</>;
}

interface TooltipContentProps {
  children: React.ReactNode;
}

export function TooltipContent({ children }: TooltipContentProps) {
  return <div className="hidden">{children}</div>;
}
