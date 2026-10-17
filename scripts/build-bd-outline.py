"""Derive a matching national outline from the pinned Bangladesh ADM2 polygons.

Run: python scripts/build-bd-outline.py [--check]
Requires Shapely 2 at build time; the generated GeoJSON has no runtime dependency.
"""

import json
import sys
from pathlib import Path

from shapely.geometry import MultiLineString, MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid


SOURCE = Path("public/data/bd-districts.geojson")
TARGET = Path("public/data/bd-outline.geojson")
DISPLAY_TARGET = Path("public/data/bd-outline-display.geojson")
DIVISIONS_TARGET = Path("public/data/bd-division-lines.geojson")
CONTEXT_SOURCE = Path("public/data/bd-context.geojson")
CONTEXT_DISPLAY_TARGET = Path("public/data/bd-context-display.geojson")
CONTEXT_LINES_TARGET = Path("public/data/bd-context-lines.geojson")
districts = json.loads(SOURCE.read_text(encoding="utf-8"))["features"]
if len(districts) != 64:
    raise ValueError("Expected 64 pinned district polygons")


def polygon_parts(geometry):
    if geometry.geom_type == "Polygon":
        return [geometry]
    if not hasattr(geometry, "geoms"):
        return []
    return [polygon for part in geometry.geoms for polygon in polygon_parts(part)]


district_shapes = [unary_union(polygon_parts(make_valid(shape(feature["geometry"])))) for feature in districts]
country = unary_union(district_shapes)
parts = list(country.geoms) if hasattr(country, "geoms") else [country]
# Tiny delta islands still appear in the district fill; outlining each at country scale creates noise.
display = MultiPolygon([Polygon(part.exterior).simplify(0.006, preserve_topology=True) for part in parts if part.area >= 0.02])
# Use only shared interior edges for the division layer. The national border is drawn separately.
internal = unary_union([district.boundary for district in district_shapes]).difference(country.boundary.buffer(0.0008))


def line_parts(geometry):
    if geometry.geom_type == "LineString":
        return [geometry] if geometry.length >= 0.005 else []
    if not hasattr(geometry, "geoms"):
        return []
    return [line for part in geometry.geoms for line in line_parts(part)]


divisions = MultiLineString([line.simplify(0.0006, preserve_topology=True) for line in line_parts(internal)])
# Natural Earth context does not share the ADM2 national edge. Suppress nearby
# context strokes so they cannot draw a second, conflicting Bangladesh border.
context_features = json.loads(CONTEXT_SOURCE.read_text(encoding="utf-8"))["features"]
context_display = {"type": "FeatureCollection", "features": [
    {
        "type": "Feature",
        "properties": feature["properties"],
        "geometry": mapping(country if feature["properties"]["id"] == "BGD"
                            else make_valid(shape(feature["geometry"])).difference(country)),
    }
    for feature in context_features
]}
context_edges = unary_union([
    make_valid(shape(feature["geometry"])).boundary
    for feature in context_features if feature["properties"]["id"] != "BGD"
])
context_lines = MultiLineString(line_parts(context_edges.difference(country.buffer(0.16))))


def geojson(geometry):
    return json.dumps({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"id": "BGD"}, "geometry": mapping(geometry)}]}, separators=(",", ":")) + "\n"


output = geojson(country)
display_output = geojson(display)
divisions_output = geojson(divisions)
context_lines_output = geojson(context_lines)
context_display_output = json.dumps(context_display, separators=(",", ":")) + "\n"
if "--check" in sys.argv:
    if (TARGET.read_text(encoding="utf-8") != output
            or DISPLAY_TARGET.read_text(encoding="utf-8") != display_output
            or DIVISIONS_TARGET.read_text(encoding="utf-8") != divisions_output
            or CONTEXT_DISPLAY_TARGET.read_text(encoding="utf-8") != context_display_output
            or CONTEXT_LINES_TARGET.read_text(encoding="utf-8") != context_lines_output):
        raise ValueError("Bangladesh outline is stale")
else:
    TARGET.write_text(output, encoding="utf-8")
    DISPLAY_TARGET.write_text(display_output, encoding="utf-8")
    DIVISIONS_TARGET.write_text(divisions_output, encoding="utf-8")
    CONTEXT_DISPLAY_TARGET.write_text(context_display_output, encoding="utf-8")
    CONTEXT_LINES_TARGET.write_text(context_lines_output, encoding="utf-8")
print(f"Bangladesh cartography: {len(districts)} districts, {len(display.geoms)} outlined parts, {len(divisions.geoms)} interior line parts, {len(context_lines.geoms)} context lines")
