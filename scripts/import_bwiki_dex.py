#!/usr/bin/env python3
"""Convert a locally saved BWiki creature table into the site's attribution-aware JSON."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin


SOURCE_PAGE = "https://wiki.biligame.com/nrc/%E7%B2%BE%E7%81%B5%E5%88%97%E8%A1%A8"
SOURCE_BASE = "https://wiki.biligame.com"
LICENSE = "CC BY-NC-SA 4.0"
HEADERS = [
    "number", "portrait", "name", "types", "trait", "hp", "speed",
    "physicalAttack", "specialAttack", "physicalDefense", "specialDefense",
    "totalBaseStats", "traitEffect", "evolutionStage", "form", "season",
    "eggGroup", "height", "weight", "rideable", "coRideable", "description",
]


class FirstTable(HTMLParser):
    """Read cell text and source links from the first HTML table; omit image bytes."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.table_started = False
        self.in_table = False
        self.in_row = False
        self.cell: dict | None = None
        self.rows: list[list[dict]] = []
        self.row: list[dict] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "table" and not self.table_started:
            self.table_started = True
            self.in_table = True
            return
        if not self.in_table:
            return
        if tag == "tr":
            self.in_row = True
            self.row = []
        elif tag in {"th", "td"} and self.in_row:
            self.cell = {"text": [], "attrs": attributes, "links": []}
            self.row.append(self.cell)
        elif self.cell and tag == "a":
            self.cell["links"].append({
                "href": attributes.get("href"),
                "title": attributes.get("title"),
            })
        elif self.cell and tag == "br":
            self.cell["text"].append(" ")

    def handle_data(self, data: str) -> None:
        if self.cell is not None:
            self.cell["text"].append(data)

    def handle_endtag(self, tag: str) -> None:
        if not self.in_table:
            return
        if tag in {"th", "td"}:
            self.cell = None
        elif tag == "tr" and self.in_row:
            if self.row:
                self.rows.append(self.row)
            self.row = []
            self.in_row = False
        elif tag == "table":
            self.in_table = False


def cell_text(cell: dict) -> str:
    return re.sub(r"\s+", " ", "".join(cell["text"])).strip()


def value_or_none(value: str):
    cleaned = value.strip()
    return None if cleaned in {"", "—", "–", "-"} else cleaned


def integer_or_none(value: str):
    cleaned = value.strip()
    return int(cleaned) if re.fullmatch(r"\d+", cleaned) else None


def split_types(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,，|/、]", value) if part.strip()]


def make_record(row: list[dict], occurrence: int, checked_on: str, updated_on: str) -> dict:
    cells = row[1:] if len(row) == 22 and row[0].get("tag") == "th" else row
    if len(cells) != len(HEADERS):
        raise ValueError(f"Expected 22 columns, found {len(cells)}")
    values = [cell_text(cell) for cell in cells]
    number = values[0]
    if not re.fullmatch(r"\d{1,4}", number):
        raise ValueError(f"Unexpected catalog number: {number!r}")
    name_link = next((link for link in cells[2]["links"] if link.get("href")), {})
    type_value = cells[3]["attrs"].get("data-sort-value", "") or values[3]
    trait_link = next((link for link in cells[4]["links"] if link.get("href")), {})
    source_href = name_link.get("href")
    return {
        "recordId": f"{int(number):03d}-{occurrence:02d}",
        "catalogNumber": f"{int(number):03d}",
        "name": values[2],
        "types": split_types(type_value),
        "trait": value_or_none(values[4]),
        "stats": {
            "hp": integer_or_none(values[5]),
            "speed": integer_or_none(values[6]),
            "physicalAttack": integer_or_none(values[7]),
            "specialAttack": integer_or_none(values[8]),
            "physicalDefense": integer_or_none(values[9]),
            "specialDefense": integer_or_none(values[10]),
            "total": integer_or_none(values[11]),
        },
        "traitEffect": value_or_none(values[12]),
        "evolutionStage": value_or_none(values[13]),
        "form": value_or_none(values[14]),
        "season": value_or_none(values[15]),
        "eggGroup": value_or_none(values[16]),
        "height": value_or_none(values[17]),
        "weight": value_or_none(values[18]),
        "rideable": value_or_none(values[19]),
        "coRideable": value_or_none(values[20]),
        "description": value_or_none(values[21]),
        "source": {
            "page": urljoin(SOURCE_BASE, source_href) if source_href else SOURCE_PAGE,
            "listPage": SOURCE_PAGE,
            "communityUpdatedOn": updated_on,
            "checkedOn": checked_on,
            "license": LICENSE,
            "confidence": "community transcription; verify current acquisition details in-game",
            "traitPage": urljoin(SOURCE_BASE, trait_link["href"]) if trait_link.get("href") else None,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_html", type=Path, help="locally saved BWiki creature-list HTML")
    parser.add_argument("output_json", type=Path, help="destination JSON path")
    parser.add_argument("--checked-on", required=True, help="source review date, YYYY-MM-DD")
    parser.add_argument("--community-updated-on", required=True, help="date shown by the source page")
    args = parser.parse_args()

    html = args.source_html.read_text(encoding="utf-8")
    table = FirstTable()
    table.feed(html)
    if not table.rows:
        raise SystemExit("No creature table found; preserve the source and review the page structure.")

    data_rows = [
        row for row in table.rows
        if len(row) == 22 and re.fullmatch(r"\d{1,4}", cell_text(row[0]))
    ]
    if not data_rows:
        raise SystemExit("No complete creature rows found; preserve the source and review the page structure.")

    occurrences: Counter[str] = Counter()
    records = []
    for row in data_rows:
        number = cell_text(row[0])
        occurrences[number] += 1
        records.append(make_record(row, occurrences[number], args.checked_on, args.community_updated_on))

    dataset = {
        "title": "Roco Kingdom: World creature and form index",
        "edition": "Roco Kingdom: World",
        "recordType": "community-listed catalog forms",
        "recordCount": len(records),
        "uniqueCatalogNumbers": len({record["catalogNumber"] for record in records}),
        "catalogNumberRange": [min(record["catalogNumber"] for record in records), max(record["catalogNumber"] for record in records)],
        "communityUpdatedOn": args.community_updated_on,
        "checkedOn": args.checked_on,
        "source": SOURCE_PAGE,
        "license": LICENSE,
        "artworkIncluded": False,
        "countNote": "Rows represent the source list's forms, not a verified count of distinct base creatures. Counts from other indexes may use different inclusion rules.",
        "records": records,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "records": dataset["recordCount"],
        "catalogNumbers": dataset["uniqueCatalogNumbers"],
        "range": dataset["catalogNumberRange"],
        "output": str(args.output_json.resolve()),
    }, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
