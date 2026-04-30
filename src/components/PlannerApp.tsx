"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { aggregateByMonth, totalYearHours } from "@/lib/planner/aggregate";
import { groupBySeries } from "@/lib/planner/group-series";
import { applyScenario, emptyScenario, expandRitualRule } from "@/lib/planner/scenario";
import { STORAGE_KEYS, type SyntheticRitual } from "@/lib/planner/types";
import { ManualRitualsPanel } from "@/components/ManualRitualsPanel";
import { RitualYearCalendar } from "@/components/RitualYearCalendar";
import { YearGrid } from "@/components/YearGrid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const YEAR = 2027;

export default function PlannerApp() {
  const [manualRituals, setManualRituals] = useState<SyntheticRitual[]>([]);
  const [teamTz, setTeamTz] = useState("Europe/Amsterdam");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    startTransition(() => {
      try {
        const mr = localStorage.getItem(STORAGE_KEYS.manualRituals);
        if (mr) {
          const parsed = JSON.parse(mr) as SyntheticRitual[];
          if (Array.isArray(parsed)) setManualRituals(parsed);
        }
        const tz = localStorage.getItem(STORAGE_KEYS.timeZone);
        if (tz) setTeamTz(tz);
      } catch {
        /* ignore */
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.timeZone, teamTz);
  }, [hydrated, teamTz]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEYS.manualRituals,
      JSON.stringify(manualRituals),
    );
  }, [hydrated, manualRituals]);

  const manualExpanded = useMemo(
    () => manualRituals.flatMap((r) => expandRitualRule(r, teamTz)),
    [manualRituals, teamTz],
  );

  const groups = useMemo(
    () => groupBySeries(manualExpanded),
    [manualExpanded],
  );

  const occurrences = useMemo(
    () => applyScenario(groups, emptyScenario(), teamTz),
    [groups, teamTz],
  );

  const monthTotals = useMemo(
    () => aggregateByMonth(occurrences, teamTz),
    [occurrences, teamTz],
  );

  const hoursYear = useMemo(
    () => totalYearHours(occurrences),
    [occurrences],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Team rituals · {YEAR}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Meeting load by month, full-year day view, and manual recurring entries
          (saved in this browser).
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_minmax(280px,340px)] xl:items-start">
        <div className="min-w-0 space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Meeting load</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Total hours · {YEAR}
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {hoursYear.toFixed(1)}h
              </div>
            </CardContent>
          </Card>

          <YearGrid year={YEAR} totals={monthTotals} />

          <RitualYearCalendar
            year={YEAR}
            teamTz={teamTz}
            occurrences={occurrences}
          />
        </div>

        <ManualRitualsPanel
          rituals={manualRituals}
          teamTz={teamTz}
          onTeamTzChange={setTeamTz}
          onAdd={(r) => setManualRituals((prev) => [...prev, r])}
          onRemove={(id) =>
            setManualRituals((prev) => prev.filter((x) => x.id !== id))
          }
        />
      </div>
    </div>
  );
}
