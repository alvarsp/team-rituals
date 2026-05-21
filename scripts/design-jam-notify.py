#!/usr/bin/env python3
"""Posts the weekly Design Jam agenda from Confluence to Slack.

Reads the current week's page from the OCPD Confluence space
(title pattern: "DD-DD Month YYYY | Jams & Open Hours"), extracts
the Tuesday or Friday section, and posts a structured message to
the #specx-design-team Slack channel via incoming webhook.

Required env vars:
  CONFLUENCE_EMAIL     Atlassian account email
  CONFLUENCE_TOKEN     Atlassian API token
  SLACK_WEBHOOK_URL    Slack incoming webhook URL

Optional env vars:
  JAM_DAY              "Tuesday" or "Friday" — overrides weekday detection
                       (useful for workflow_dispatch manual runs)
"""

import base64
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

CONFLUENCE_BASE = "https://naspersclassifieds.atlassian.net"
CONFLUENCE_EMAIL = os.environ["CONFLUENCE_EMAIL"]
CONFLUENCE_TOKEN = os.environ["CONFLUENCE_TOKEN"]
SLACK_WEBHOOK_URL = os.environ["SLACK_WEBHOOK_URL"]

SKIP_HEADERS = {
    "Designer", "Pack", "Topic's Summary", "Topic's summary",
    "Useful links", "Useful Links", "People of interest",
}


def confluence_get(path: str) -> dict:
    auth = base64.b64encode(f"{CONFLUENCE_EMAIL}:{CONFLUENCE_TOKEN}".encode()).decode()
    req = urllib.request.Request(
        f"{CONFLUENCE_BASE}{path}",
        headers={"Authorization": f"Basic {auth}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    for entity, char in [
        ("&amp;", "&"), ("&rsquo;", "'"), ("&nbsp;", " "),
        ("&lt;", "<"), ("&gt;", ">"), ("&#39;", "'"),
    ]:
        s = s.replace(entity, char)
    s = re.sub(r"&[a-z#0-9]+;", "", s)
    return re.sub(r"\s+", " ", s).strip()


def find_page_id(monday: datetime) -> str | None:
    cql = 'space = "OCPD" AND title ~ "Jams" AND title ~ "Open Hours"'
    params = urllib.parse.urlencode({"cql": cql, "limit": 5})
    results = confluence_get(f"/wiki/rest/api/content/search?{params}")["results"]

    for result in results:
        title = result["title"]
        if str(monday.day) in title and monday.strftime("%b") in title:
            return result["id"]
        if str(monday.day) in title and monday.strftime("%B") in title:
            return result["id"]

    return results[0]["id"] if results else None


def parse_jams(html: str, day_name: str) -> list[dict]:
    next_days = {
        "Tuesday": r"(?:Wednesday|Thursday|Friday|Saturday|Sunday)",
        "Friday": r"(?:Saturday|Sunday)",
    }
    next_pat = next_days.get(day_name, r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)")

    section = re.search(
        rf"<h[1-6][^>]*>\s*{day_name}\s*</h[1-6]>(.*?)(?=<h[1-6][^>]*>\s*{next_pat}\s*</h[1-6]>|$)",
        html,
        re.DOTALL | re.IGNORECASE,
    )
    if not section:
        return []

    jams = []
    current = None

    for part in re.split(r"(<h[1-6][^>]*>.*?</h[1-6]>)", section.group(1), flags=re.DOTALL):
        heading = re.search(r"<h[1-6][^>]*>(.*?)</h[1-6]>", part, re.DOTALL)
        if heading:
            if current:
                jams.append(current)
            current = {"name": clean(heading.group(1)), "time": None, "entries": []}
        elif current:
            for row in re.findall(r"<tr[^>]*>(.*?)</tr>", part, re.DOTALL):
                cells = [clean(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.DOTALL) if clean(c)]
                if not cells or all(c in SKIP_HEADERS for c in cells):
                    continue
                time_match = re.match(r"(\d+:\d+\s*(?:am|pm))(?:\s*\|\s*\d+:\d+\s*(?:am|pm))?", cells[0], re.IGNORECASE)
                if time_match and not current["time"]:
                    current["time"] = time_match.group(1).strip()
                    continue
                if len(cells) >= 3 and cells[0] not in ("@", ""):
                    current["entries"].append({
                        "designer": cells[0] if cells[0] != "@" else None,
                        "pack": cells[1] if len(cells) > 1 and cells[1] not in ("@", "") else None,
                        "topic": cells[2] if len(cells) > 2 and cells[2] not in ("@", "") else None,
                        "link": next((c for c in cells[3:] if c.startswith("http")), None),
                    })

    if current:
        jams.append(current)

    return jams


def format_message(day_name: str, date_str: str, jams: list[dict], page_url: str) -> str:
    lines = [f":art: *Design Jams Today — {day_name} {date_str}*\n"]

    for jam in jams:
        time_str = f" • _{jam['time']}_" if jam["time"] else ""
        lines.append(f"*{jam['name']}*{time_str}")
        if not jam["entries"]:
            lines.append("  • _No sessions booked yet_")
        for entry in jam["entries"]:
            parts = []
            if entry["designer"]:
                parts.append(f"*{entry['designer']}*")
            if entry["pack"]:
                parts.append(entry["pack"])
            if entry["topic"]:
                parts.append(entry["topic"])
            line = "  • " + " — ".join(parts)
            if entry["link"]:
                line += f"\n    \U0001f4ce <{entry['link']}|Figma>"
            lines.append(line)
        lines.append("")

    lines.append(f"\U0001f449 <{page_url}|View full agenda> · Join via the OLX CU Design Calendar")
    return "\n".join(lines)


def post_to_slack(text: str) -> None:
    payload = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        SLACK_WEBHOOK_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        response = r.read()
    if response != b"ok":
        print(f"Unexpected Slack response: {response}", file=sys.stderr)


def main() -> None:
    today = datetime.utcnow()
    monday = today - timedelta(days=today.weekday())

    jam_day_override = os.environ.get("JAM_DAY", "").strip().capitalize()
    if jam_day_override in ("Tuesday", "Friday"):
        day_name = jam_day_override
    elif today.weekday() == 1:
        day_name = "Tuesday"
    elif today.weekday() == 4:
        day_name = "Friday"
    else:
        print(f"Today (weekday={today.weekday()}) is not a Design Jam day. Set JAM_DAY to override.")
        sys.exit(0)

    day_offset = 1 if day_name == "Tuesday" else 4
    day_date = monday + timedelta(days=day_offset)
    date_str = day_date.strftime("%-d %B")

    page_id = find_page_id(monday)
    if not page_id:
        fallback = (
            f":art: *Design Jams Today — {day_name} {date_str}*\n\n"
            "_Could not fetch agenda from Confluence. Check the page manually._\n\n"
            f"\U0001f449 {CONFLUENCE_BASE}/wiki/spaces/OCPD"
        )
        post_to_slack(fallback)
        print("Posted fallback message (page not found).")
        sys.exit(0)

    page_url = f"{CONFLUENCE_BASE}/wiki/spaces/OCPD/pages/{page_id}"
    html = confluence_get(f"/wiki/rest/api/content/{page_id}?expand=body.view")["body"]["view"]["value"]

    jams = parse_jams(html, day_name)
    message = format_message(day_name, date_str, jams, page_url)
    post_to_slack(message)
    print(f"✓ Posted {day_name} agenda ({len(jams)} jams) to Slack")


if __name__ == "__main__":
    main()
