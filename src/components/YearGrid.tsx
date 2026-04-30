import type { MonthTotals } from "@/lib/planner/aggregate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.05) {
    return "±0 vs baseline";
  }
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}h vs baseline`;
}

export function YearGrid({
  totals,
  baselineTotals,
  year,
}: {
  totals: MonthTotals[];
  baselineTotals?: MonthTotals[];
  year: number;
}) {
  const max = Math.max(1, ...totals.map((t) => t.hours));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        Meeting load by month ({year})
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {totals.map((t) => {
          const base = baselineTotals?.[t.monthIndex];
          const delta = base ? t.hours - base.hours : 0;
          const pct = Math.min(100, (t.hours / max) * 100);
          return (
            <Card key={t.monthIndex} size="sm" className="py-3 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium tracking-wide uppercase">
                  {MONTHS[t.monthIndex]}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {t.hours.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground">
                    h
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  {t.count} sessions
                </p>
                {baselineTotals ? (
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      delta > 0.05 && "text-amber-600 dark:text-amber-400",
                      delta < -0.05 && "text-emerald-600 dark:text-emerald-400",
                      Math.abs(delta) <= 0.05 && "text-muted-foreground",
                    )}
                  >
                    {formatDelta(delta)}
                  </p>
                ) : null}
                <Progress value={pct} className="gap-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
