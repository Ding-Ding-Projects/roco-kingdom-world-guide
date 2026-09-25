#!/usr/bin/env python3
"""Fetch and extract text-only detail panels for every imported creature form."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import random
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen


LICENSE = "CC BY-NC-SA 4.0"
USER_AGENT = "Mozilla/5.0 (compatible; RocoKingdomWorldGuide/1.0)"
API_BASE = "https://wiki.biligame.com/nrc/api.php"
PANELS = {
    "appearance": ("rocodex-pAppear", "Appearance and description"),
    "information": ("rocodex-pInfo", "Types, trait, and stats"),
    "skills": ("rocodex-pSkill", "Skills and skill challenges"),
    "trainingReference": ("rocodex-pReference", "Community build reference"),
    "evolution": ("rocodex-pEvo", "Evolution paths"),
    "encyclopediaTasks": ("rocodex-pQuest", "Encyclopedia tasks"),
    "ecologyAndAcquisition": ("rocodex-pEco", "Ecology and acquisition"),
    "history": ("rocodex-pHistory", "Page history"),
}
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


class Element:
    __slots__ = ("tag", "attrs", "children")

    def __init__(self, tag: str, attrs: dict[str, str | None]) -> None:
        self.tag = tag
        self.attrs = attrs
        self.children: list[Element | str] = []


class TreeParser(HTMLParser):
    """Build a small HTML tree with the standard-library parser."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Element("document", {})
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID_ELEMENTS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.stack[-1].children.append(Element(tag, dict(attrs)))

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if data:
            self.stack[-1].children.append(data)


def elements(root: Element, predicate) -> list[Element]:
    found: list[Element] = []
    pending = [root]
    while pending:
        node = pending.pop()
        if predicate(node):
            found.append(node)
        pending.extend(child for child in reversed(node.children) if isinstance(child, Element))
    return found


def classes(node: Element) -> set[str]:
    return set((node.attrs.get("class") or "").split())


def find_class(root: Element, class_name: str) -> list[Element]:
    return elements(root, lambda node: class_name in classes(node))


def first_class(root: Element, class_name: str) -> Element | None:
    found = find_class(root, class_name)
    return found[0] if found else None


def text_content(node: Element | str | None) -> str:
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if node.tag in {"script", "style", "noscript"}:
        return ""
    if node.tag == "img":
        return node.attrs.get("alt") or ""
    return " ".join(text_content(child) for child in node.children if isinstance(child, (Element, str)))


def clean_text(value: str) -> str | None:
    cleaned = re.sub(r"[\s\u200b\ufeff]+", " ", value).strip()
    return cleaned or None


def child_text(root: Element, class_name: str) -> str | None:
    return clean_text(text_content(first_class(root, class_name)))


def page_title(page_url: str) -> str:
    parsed = urlsplit(page_url)
    if parsed.netloc.lower() != "wiki.biligame.com" or not parsed.path.startswith("/nrc/"):
        raise ValueError("Creature source page is outside the expected wiki path.")
    return unquote(parsed.path.removeprefix("/nrc/")).replace("_", " ")


def api_url(title: str) -> str:
    query = urlencode({
        "action": "parse",
        "page": title,
        "prop": "text",
        "format": "json",
        "formatversion": "2",
    }, quote_via=quote)
    return f"{API_BASE}?{query}"


def request_page(title: str) -> dict:
    request = Request(api_url(title), headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
    })
    with urlopen(request, timeout=30) as response:
        payload = response.read()
        if response.headers.get("Content-Encoding", "").lower() == "gzip":
            payload = gzip.decompress(payload)
    result = json.loads(payload.decode("utf-8-sig"))
    parsed = result.get("parse")
    if not isinstance(parsed, dict) or not isinstance(parsed.get("text"), str):
        error = result.get("error", {})
        raise ValueError(f"Wiki API returned no page text: {error.get('code', 'unknown response')}")
    return parsed


def source_cache_path(cache_dir: Path, page_url: str) -> Path:
    digest = hashlib.sha256(page_url.encode("utf-8")).hexdigest()
    return cache_dir / f"{digest}.json"


def parse_skills(panel: Element | None) -> list[dict]:
    if panel is None:
        return []
    cards = find_class(panel, "roco-sk-card")
    details = find_class(panel, "roco-sk-dcard")
    details_by_name: dict[str, list[Element]] = {}
    for detail in details:
        name = child_text(detail, "roco-sk-dtitle")
        if name:
            details_by_name.setdefault(name, []).append(detail)

    skills: list[dict] = []
    for card in cards:
        name = child_text(card, "roco-sk-name")
        if not name:
            continue
        detail_options = details_by_name.get(name, [])
        detail = detail_options.pop(0) if detail_options else None
        raw_unlock = child_text(card, "roco-sk-lv")
        level = re.fullmatch(r"LV\s*(\d+)", raw_unlock or "", re.IGNORECASE)
        quest = card.attrs.get("data-quest")
        stats = []
        if detail is not None:
            for stat in find_class(detail, "roco-sk-dstat"):
                label = child_text(stat, "roco-sk-dstat-lab")
                value = child_text(stat, "roco-sk-dstat-val")
                if label or value:
                    stats.append({"label": label, "value": value})
        skills.append({
            "id": card.attrs.get("data-skill-id"),
            "name": name,
            "source": card.attrs.get("data-source"),
            "sourceLabel": raw_unlock,
            "level": int(level.group(1)) if level else None,
            "element": card.attrs.get("data-type"),
            "category": card.attrs.get("data-cat"),
            "power": card.attrs.get("data-power"),
            "energyCost": child_text(card, "roco-sk-cost"),
            "description": child_text(card, "roco-sk-card-desc"),
            "quest": clean_text(quest) if quest else None,
            "detail": {
                "description": child_text(detail, "roco-sk-ddesc-text") if detail else None,
                "stats": stats,
                "text": clean_text(text_content(detail)) if detail else None,
            } if detail else None,
        })
    return skills


def parse_information(panel: Element | None) -> dict | None:
    if panel is None:
        return None
    stats = {}
    for row in find_class(panel, "roco-stat"):
        name = child_text(row, "roco-stat-name")
        value = child_text(row, "roco-stat-val")
        if name and value:
            stats[name] = value
    talents = []
    for item in find_class(panel, "roco-talent"):
        name = child_text(item, "roco-talent-name")
        chance = child_text(item, "roco-talent-pct")
        if name or chance:
            talents.append({"name": name, "probability": chance})
    dimensions = []
    for pill in find_class(panel, "roco-pill"):
        value = clean_text(text_content(pill))
        if value and re.search(r"(?:kg|m)$", value, re.IGNORECASE):
            dimensions.append(value)
    return {
        "category": child_text(panel, "roco-kicker"),
        "trait": {
            "name": child_text(panel, "roco-feature-name"),
            "effect": child_text(panel, "roco-feature-desc"),
        },
        "baseStats": stats,
        "totalBaseStats": child_text(panel, "roco-race-total"),
        "dimensions": dimensions,
        "eggGroup": next((value.removeprefix("蛋组：").strip() for value in (clean_text(text_content(pill)) for pill in find_class(panel, "roco-pill")) if value and value.startswith("蛋组：")), None),
        "talentProbabilities": talents,
        "talentNote": child_text(panel, "roco-talent-note"),
        "databaseUpdatedOn": child_text(panel, "roco-time-pill"),
    }


def parse_page(parsed: dict, record: dict, checked_on: str) -> dict:
    parser = TreeParser()
    parser.feed(parsed["text"])
    nodes_by_id = {node.attrs.get("id"): node for node in elements(parser.root, lambda node: bool(node.attrs.get("id")))}
    panels: dict[str, dict] = {}
    for key, (panel_id, label) in PANELS.items():
        panel = nodes_by_id.get(panel_id)
        panel_text = clean_text(text_content(panel)) if panel else None
        panels[key] = {"label": label, "available": bool(panel_text), "text": panel_text}

    appearance = nodes_by_id.get("rocodex-pAppear")
    related_forms = []
    if appearance is not None:
        for anchor in elements(appearance, lambda node: node.tag == "a" and bool(node.attrs.get("href"))):
            href = anchor.attrs["href"] or ""
            if not href.startswith("/nrc/"):
                continue
            target = urljoin(record["source"]["page"], href)
            name = clean_text(text_content(anchor))
            if name and target != record["source"]["page"] and target not in {item["page"] for item in related_forms}:
                related_forms.append({"name": name, "page": target})

    information = nodes_by_id.get("rocodex-pInfo")
    skills_panel = nodes_by_id.get("rocodex-pSkill")
    return {
        "recordId": record["recordId"],
        "catalogNumber": record["catalogNumber"],
        "name": record["name"],
        "resolvedTitle": parsed.get("title"),
        "checkedOn": checked_on,
        "source": {
            "page": record["source"]["page"],
            "license": LICENSE,
            "communityUpdatedOn": record["source"].get("communityUpdatedOn"),
            "checkedOn": checked_on,
        },
        "information": parse_information(information),
        "relatedForms": related_forms,
        "skills": parse_skills(skills_panel),
        "panels": panels,
    }


def fetch_one(record: dict, checked_on: str, cache_dir: Path, delay_seconds: float) -> tuple[str, dict, bool]:
    cache_path = source_cache_path(cache_dir, record["source"]["page"])
    if cache_path.exists():
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        if cached.get("recordId") == record["recordId"]:
            return record["recordId"], cached, True

    title = page_title(record["source"]["page"])
    last_reason = "No response"
    for attempt in range(3):
        time.sleep(delay_seconds + random.random() * min(delay_seconds / 5, 0.15))
        try:
            parsed = request_page(title)
            detail = parse_page(parsed, record, checked_on)
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            temporary = cache_path.with_suffix(".tmp")
            temporary.write_text(json.dumps(detail, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            temporary.replace(cache_path)
            return record["recordId"], detail, False
        except HTTPError as error:
            last_reason = f"HTTP {error.code}"
            if error.code != 429 and error.code < 500:
                break
            retry_after = error.headers.get("Retry-After")
            try:
                pause = max(1.0, min(15.0, float(retry_after))) if retry_after else 2 ** attempt
            except ValueError:
                pause = 2 ** attempt
            time.sleep(pause)
        except (URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as error:
            last_reason = type(error).__name__
            if attempt < 2:
                time.sleep(2 ** attempt)

    failure = {
        "recordId": record["recordId"],
        "catalogNumber": record["catalogNumber"],
        "name": record["name"],
        "checkedOn": checked_on,
        "source": {"page": record["source"]["page"], "license": LICENSE, "checkedOn": checked_on},
        "status": "unavailable",
        "reason": last_reason,
    }
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = cache_path.with_suffix(".tmp")
    temporary.write_text(json.dumps(failure, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(cache_path)
    return record["recordId"], failure, False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("creature_index", type=Path, help="existing creature-list JSON")
    parser.add_argument("output_json", type=Path, help="destination detail JSON")
    parser.add_argument("--checked-on", required=True, help="review date, YYYY-MM-DD")
    parser.add_argument("--cache-dir", required=True, type=Path, help="private cache directory outside the public source tree")
    parser.add_argument("--workers", type=int, default=2, help="simultaneous requests, from 1 to 4")
    parser.add_argument("--delay-ms", type=int, default=500, help="minimum delay before each request")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.checked_on):
        parser.error("--checked-on must use YYYY-MM-DD")
    if not 1 <= args.workers <= 4:
        parser.error("--workers must be from 1 to 4")
    if not 100 <= args.delay_ms <= 5000:
        parser.error("--delay-ms must be from 100 to 5000")

    index = json.loads(args.creature_index.read_text(encoding="utf-8"))
    records = index.get("records")
    if not isinstance(records, list) or not records:
        parser.error("The creature index must contain a non-empty records list.")
    cache_dir = args.cache_dir.resolve()
    delay_seconds = args.delay_ms / 1000
    results: dict[str, dict] = {}
    cached_count = 0
    fetched_count = 0
    progress_lock = threading.Lock()
    completed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(fetch_one, row, args.checked_on, cache_dir, delay_seconds) for row in records]
        for future in as_completed(futures):
            record_id, result, was_cached = future.result()
            results[record_id] = result
            with progress_lock:
                completed += 1
                cached_count += int(was_cached)
                fetched_count += int(not was_cached)
                if completed % 25 == 0 or completed == len(records):
                    print(f"Processed {completed}/{len(records)} records; cached {cached_count}; requested {fetched_count}.")

    ordered = [results[row["recordId"]] for row in records]
    successful = [item for item in ordered if item.get("status") != "unavailable"]
    unavailable = [
        {"recordId": item["recordId"], "name": item["name"], "page": item["source"]["page"], "reason": item["reason"]}
        for item in ordered if item.get("status") == "unavailable"
    ]
    output = {
        "title": "Roco Kingdom: World creature detail index",
        "checkedOn": args.checked_on,
        "license": LICENSE,
        "source": index.get("source"),
        "sourceListUpdatedOn": index.get("communityUpdatedOn"),
        "scope": "Text-only detail panels and skill entries from each linked community creature page. Artwork, page styles, and remote images are excluded.",
        "recordCount": len(ordered),
        "availableRecordCount": len(successful),
        "unavailableRecordCount": len(unavailable),
        "unavailableRecords": unavailable,
        "records": ordered,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output_json.with_suffix(args.output_json.suffix + ".tmp")
    temporary.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(args.output_json)
    print(json.dumps({
        "records": len(ordered),
        "available": len(successful),
        "unavailable": len(unavailable),
        "skills": sum(len(item.get("skills", [])) for item in successful),
        "outputBytes": args.output_json.stat().st_size,
    }, ensure_ascii=True))
    return 0 if not unavailable else 2


if __name__ == "__main__":
    raise SystemExit(main())
