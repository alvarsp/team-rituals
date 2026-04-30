"use client";

import { useState } from "react";
import type { SyntheticRitual } from "@/lib/planner/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMEZONE_PRESETS = [
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/London",
  "UTC",
  "America/New_York",
];

type Props = {
  rituals: SyntheticRitual[];
  teamTz: string;
  onTeamTzChange: (tz: string) => void;
  onAdd: (r: SyntheticRitual) => void;
  onRemove: (id: string) => void;
};

export function ManualRitualsPanel({
  rituals,
  teamTz,
  onTeamTzChange,
  onAdd,
  onRemove,
}: Props) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [intervalWeeks, setIntervalWeeks] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("4");
  const [timeOfDay, setTimeOfDay] = useState("10:00");

  const tzSelectValue = (TIMEZONE_PRESETS as readonly string[]).includes(teamTz)
    ? teamTz
    : "__custom__";

  return (
    <Card className="top-6 h-fit py-4 lg:sticky">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Manual recurring rituals</CardTitle>
        <CardDescription>
          Add meetings by hand (saved in this browser). Times use the team
          timezone below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Team timezone</Label>
          <div className="flex flex-col gap-2">
            <Select
              value={tzSelectValue}
              onValueChange={(v) => {
                if (v && v !== "__custom__") onTeamTzChange(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_PRESETS.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom…</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="font-mono text-xs"
              placeholder="IANA e.g. Europe/Warsaw"
              value={tzSelectValue === "__custom__" ? teamTz : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v) onTeamTzChange(v);
              }}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor="manual-title">Title</Label>
            <Input
              id="manual-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design all-hands"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-dur">Minutes</Label>
              <Input
                id="manual-dur"
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-time">Time</Label>
              <Input
                id="manual-time"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weekday</Label>
            <Select value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d, i) => (
                  <SelectItem key={d} value={String(i)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Every N weeks</Label>
            <Select
              value={intervalWeeks}
              onValueChange={(v) => v && setIntervalWeeks(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              const t = title.trim();
              if (!t) return;
              onAdd({
                id: `manual:${crypto.randomUUID()}`,
                title: t,
                durationMinutes: Number.parseInt(duration, 10) || 60,
                intervalWeeks: Number.parseInt(intervalWeeks, 10) || 1,
                dayOfWeek: Number.parseInt(dayOfWeek, 10) || 0,
                timeOfDay,
              });
              setTitle("");
            }}
          >
            Add ritual
          </Button>
        </div>

        {rituals.length > 0 ? (
          <ul className="space-y-2 border-t border-border pt-4">
            {rituals.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium leading-snug">{r.title}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {r.durationMinutes}m · every {r.intervalWeeks}w ·{" "}
                    {WEEKDAYS[r.dayOfWeek]} @ {r.timeOfDay}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-destructive hover:text-destructive"
                  onClick={() => onRemove(r.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            No rituals yet — add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
