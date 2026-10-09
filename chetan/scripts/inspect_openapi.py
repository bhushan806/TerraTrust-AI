import json
from pathlib import Path

with open("openapi.yaml", "r", encoding="utf-8") as f:
    spec = json.load(f)

print("Title:", spec.get("info", {}).get("title"))
print("Version:", spec.get("info", {}).get("version"))
print("\nPaths and Operations:")
for path, methods in sorted(spec.get("paths", {}).items()):
    for method, op in methods.items():
        if method.lower() in ["get", "post", "patch", "put", "delete"]:
            tags = ",".join(op.get("tags", []))
            op_id = op.get("operationId", "no-id")
            summary = op.get("summary", "")
            print(f"{method.upper():<6} {path:<45} {op_id:<32} [{tags}] - {summary}")

print("\nSchemas:")
schemas = sorted(list(spec.get("components", {}).get("schemas", {}).keys()))
print(f"Total Schemas: {len(schemas)}")
for s in schemas:
    print(f" - {s}")
