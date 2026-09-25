#!/usr/bin/env python3
"""Join a pinned community data snapshot to this edition's creature index."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote


SOURCE_REPOSITORY = "https://github.com/JayeGT002/rocom-wiki-data"
DATA_LICENSE = "CC BY-NC-SA 4.0"


def read_lua_table(parser, folder: Path, name: str):
    path = folder / f"{name}.lua"
    return parser.LuaTableParser(path.read_text(encoding="utf-8")).parse()


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--source-root", type=Path, required=True, help="Pinned community source checkout or extracted snapshot")
    cli.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parents[1])
    cli.add_argument("--source-commit", required=True, help="Exact source revision used to obtain the Lua files")
    cli.add_argument("--source-version", required=True, help="Version label reported by the source snapshot")
    cli.add_argument("--source-updated-on", required=True, help="Source timestamp copied from its published metadata")
    args = cli.parse_args()

    source_root = args.source_root.resolve()
    project_root = args.project_root.resolve()
    tool_path = source_root / "tools" / "pet_data.py"
    if not tool_path.is_file():
        raise SystemExit(f"Missing source parser: {tool_path}")
    spec = importlib.util.spec_from_file_location("rocom_wiki_data_pet_data", tool_path)
    if spec is None or spec.loader is None:
        raise SystemExit("Could not load the pinned source parser.")
    source_parser = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source_parser)

    normalized = source_parser.load_pets("all")
    data_folder = source_root / "data" / "wiki_modules" / "Pets" / "data"
    handbooks = read_lua_table(source_parser, data_folder, "Handbooks")
    learnsets = read_lua_table(source_parser, data_folder, "Learnsets")
    skills = read_lua_table(source_parser, data_folder, "Skills")
    evolutions = read_lua_table(source_parser, data_folder, "Evolutions")
    skill_stone_topics = read_lua_table(source_parser, data_folder, "SkillStoneTopics")
    terms = read_lua_table(source_parser, data_folder, "Terms")
    type_chart = read_lua_table(source_parser, data_folder, "Types")
    training_root = read_lua_table(source_parser, data_folder, "TrainingReference")

    creature_file = project_root / "dist" / "data" / "creatures.json"
    creature_data = json.loads(creature_file.read_text(encoding="utf-8"))
    source_by_catalog_title = defaultdict(list)
    for data_id, record in normalized.items():
        source_by_catalog_title[(str(record.get("number", "")).zfill(3), record.get("title"))].append((data_id, record))

    links = {}
    catalog = {}
    evolution_refs = defaultdict(list)
    for evolution_id, variants in evolutions.items():
        for path in variants:
            for step in [*path.get("chain", []), *path.get("lord_branches", [])]:
                data_id = step.get("id")
                if data_id and evolution_id not in evolution_refs[data_id]:
                    evolution_refs[data_id].append(evolution_id)

    area_records = defaultdict(list)
    habitat_records = defaultdict(list)
    matched_source_ids = set()
    for row in creature_data["records"]:
        source_url = row.get("source", {}).get("page", "")
        source_title = unquote(source_url.rsplit("/", 1)[-1]).replace("_", " ")
        candidates = source_by_catalog_title.get((str(row.get("catalogNumber", "")).zfill(3), source_title), [])
        if len(candidates) != 1:
            raise SystemExit(f"Expected one source match for {row.get('recordId')}; found {len(candidates)}.")
        data_id, source_record = candidates[0]
        matched_source_ids.add(data_id)
        attributes = source_record.get("attributes", {})
        links[row["recordId"]] = {
            "dataId": data_id,
            "gameId": attributes.get("game_id"),
            "handbookId": attributes.get("handbook_id"),
            "learnsetId": attributes.get("learnset_id"),
            "evolutionIds": evolution_refs.get(data_id, []),
            "skillStoneTopicCount": len(skill_stone_topics.get(data_id, [])),
        }
        catalog[data_id] = attributes
        handbook = handbooks.get(attributes.get("handbook_id"), {})
        index_row = {
            "recordId": row["recordId"],
            "catalogNumber": row.get("catalogNumber"),
            "name": row.get("name"),
            "form": row.get("form"),
            "page": source_url,
            "areas": handbook.get("areas", []),
            "habitat": handbook.get("habitat"),
        }
        for area in index_row["areas"]:
            area_records[area].append(index_row)
        if index_row["habitat"]:
            habitat_records[index_row["habitat"]].append(index_row)

    if len(links) != len(creature_data["records"]) or len(matched_source_ids) != len(normalized):
        raise SystemExit(f"Snapshot match mismatch: {len(links)} local rows, {len(matched_source_ids)} source rows, {len(normalized)} source total.")

    snapshot = {
        "repository": SOURCE_REPOSITORY,
        "commit": args.source_commit,
        "version": args.source_version,
        "updatedOn": args.source_updated_on,
        "license": DATA_LICENSE,
    }
    details = {
        "schemaVersion": 1,
        "snapshot": snapshot,
        "recordCount": len(links),
        "records": links,
        "catalog": catalog,
        "handbooks": handbooks,
        "learnsets": learnsets,
        "skills": skills,
        "evolutions": evolutions,
        "skillStoneTopics": skill_stone_topics,
        "terms": terms,
    }
    training = {
        "schemaVersion": 1,
        "snapshot": snapshot,
        "sourceSeason": training_root.get("season"),
        "interpretation": "Community-submitted historical reference counts. Counts describe source submissions, not official rankings or recommended builds.",
        "labels": training_root.get("labels", {}),
        "records": {str(game_id): record for game_id, record in training_root.get("pets", {}).items()},
    }
    matchup = {
        "schemaVersion": 1,
        "snapshot": snapshot,
        "records": type_chart,
        "terms": terms,
        "note": "Matchup labels are transcribed source data. Check the current game client for any changed rules.",
    }
    write_json(project_root / "dist" / "data" / "creature-details.json", details)
    write_json(project_root / "dist" / "data" / "training-reference.json", training)
    write_json(project_root / "dist" / "data" / "type-chart.json", matchup)

    locations_path = project_root / "dist" / "data" / "locations.json"
    locations = json.loads(locations_path.read_text(encoding="utf-8"))
    locations["handbookSnapshot"] = snapshot
    locations["handbookAreas"] = [
        {"label": label, "recordIds": [row["recordId"] for row in rows], "count": len(rows)}
        for label, rows in sorted(area_records.items())
    ]
    locations["habitatIndex"] = [
        {"label": label, "recordIds": [row["recordId"] for row in rows], "count": len(rows)}
        for label, rows in sorted(habitat_records.items())
    ]
    locations["handbookEntryCount"] = len(handbooks)
    locations["linkedDexFormCount"] = len({row["recordId"] for rows in area_records.values() for row in rows})
    write_json(locations_path, locations)

    print(json.dumps({
        "creature_rows": len(links),
        "catalog_rows": len(catalog),
        "handbooks": len(handbooks),
        "learnsets": len(learnsets),
        "skills": len(skills),
        "evolution_groups": len(evolutions),
        "skill_stone_groups": len(skill_stone_topics),
        "habitat_labels": len(habitat_records),
        "handbook_areas": len(area_records),
        "training_records": len(training["records"]),
        "training_season": training["sourceSeason"],
        "type_chart_rows": len(type_chart),
        "source_commit": args.source_commit,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
