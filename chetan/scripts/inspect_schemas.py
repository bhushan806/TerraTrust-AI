import json

with open("openapi.yaml", "r", encoding="utf-8") as f:
    spec = json.load(f)

for path, methods in sorted(spec.get("paths", {}).items()):
    for method, op in methods.items():
        if method.lower() in ["get", "post", "patch", "put", "delete"]:
            op_id = op.get("operationId", "")
            req_content = op.get("requestBody", {}).get("content", {})
            resp_200 = op.get("responses", {}).get("200", {}).get("content", {})
            print(f"[{op_id}] {method.upper()} {path}")
            if req_content:
                print("  Req Content-Types:", list(req_content.keys()))
                for ct, body in req_content.items():
                    schema = body.get("schema", {})
                    print("  Req Schema:", schema.get("$ref") or schema.get("type") or schema)
            if resp_200:
                print("  Resp 200 Content-Types:", list(resp_200.keys()))
                for ct, body in resp_200.items():
                    schema = body.get("schema", {})
                    print("  Resp 200 Schema:", schema.get("$ref") or schema.get("type") or schema)
