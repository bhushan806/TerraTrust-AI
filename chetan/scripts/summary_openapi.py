import json

with open("openapi.yaml", "r", encoding="utf-8") as f:
    spec = json.load(f)

print("Paths Summary:")
for path, methods in sorted(spec.get("paths", {}).items()):
    for method, op in methods.items():
        if method.lower() in ["get", "post", "patch", "put", "delete"]:
            op_id = op.get("operationId", "")
            tags = op.get("tags", [])
            req_body = "Yes" if "requestBody" in op else "No"
            params = [p.get("name") for p in op.get("parameters", [])]
            resps = list(op.get("responses", {}).keys())
            print(f"{op_id:<32} | {method.upper():<6} {path:<40} | ReqBody: {req_body:<3} | Params: {','.join(params):<20} | Responses: {','.join(resps)}")
