"use client";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Categorical palette: bronze lead, then distinguishable cool/neutral tones (checked for light and dark backgrounds). */
export const PALETTE = ["#b07a3b", "#3b6ea5", "#2f9e8f", "#7c5cbf", "#c9553d", "#6b8e23", "#d09b2c", "#5b7083", "#a14f8f", "#3d8b5f"];

export const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  },
  itemStyle: { color: "hsl(var(--foreground))" },
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 },
} as const;

export const axisProps = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false } as const;

export function ChartCard({ title, subtitle, children, height = 300, action, empty }: { title: string; subtitle?: string; children: ReactNode; height?: number; action?: ReactNode; empty?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="grid place-items-center text-sm text-muted-foreground" style={{ height }}>
            —
          </div>
        ) : (
          <div style={{ height }} dir="ltr">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function monthLabel(m: string, locale: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(new Date(y, mo - 1, 1));
}
