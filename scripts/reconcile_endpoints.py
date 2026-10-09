import json
import yaml
from pathlib import Path
from fastapi.routing import APIRoute

import sys
import os

# Add apps/api to sys.path so we can import app.main
api_dir = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\api")
sys.path.append(str(api_dir))

from app.main import app

def main():
    # Load openapi.yaml
    openapi_path = Path(r"c:\Users\pbhus\Desktop\Fintech\openapi.yaml")
    with open(openapi_path, "r", encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    # Extract OpenAPI endpoints
    openapi_endpoints = {}
    for path, path_item in spec.get("paths", {}).items():
        for method, op in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "options", "head"}:
                continue
            
            op_id = op.get("operationId", "N/A")
            tags = op.get("tags", [])
            status = "MVP" if "MVP" in tags else "Deferred" if "Deferred" in tags else "Unknown"
            
            # Request schema
            req_schema = "N/A"
            if "requestBody" in op and "content" in op["requestBody"] and "application/json" in op["requestBody"]["content"]:
                schema_ref = op["requestBody"]["content"]["application/json"].get("schema", {}).get("$ref", "")
                req_schema = schema_ref.split("/")[-1] if schema_ref else "Inline Schema"
                
            # Response schema
            res_schema = "N/A"
            if "responses" in op and "200" in op["responses"] and "content" in op["responses"]["200"] and "application/json" in op["responses"]["200"]["content"]:
                schema_ref = op["responses"]["200"]["content"]["application/json"].get("schema", {}).get("$ref", "")
                res_schema = schema_ref.split("/")[-1] if schema_ref else "Inline Schema"
                
            openapi_endpoints[(path, method.lower())] = {
                "operationId": op_id,
                "status": status,
                "req_schema": req_schema,
                "res_schema": res_schema
            }

    # Extract FastAPI routes
    fastapi_endpoints = {}
    for route in app.routes:
        if isinstance(route, APIRoute):
            path = route.path
            for method in route.methods:
                if method.lower() in {"get", "post", "put", "patch", "delete"}:
                    # Fast api paths match openapi? 
                    # FastAPI might have /api/v1 prefix
                    normalized_path = path.replace("/api/v1", "") if path.startswith("/api/v1") else path
                    if not normalized_path:
                        normalized_path = "/"
                        
                    fastapi_endpoints[(normalized_path, method.lower())] = {
                        "name": route.name,
                        "path": path,
                        "method": method.lower()
                    }

    # Reconcile
    all_keys = set(openapi_endpoints.keys()).union(set(fastapi_endpoints.keys()))
    
    table = "| Method | Endpoint Path | Operation ID | Status | Implemented | Discrepancy |\n"
    table += "|---|---|---|---|---|---|\n"
    
    discrepancies = []
    
    for path, method in sorted(all_keys):
        oa = openapi_endpoints.get((path, method))
        fa = fastapi_endpoints.get((path, method))
        
        op_id = oa["operationId"] if oa else "N/A"
        status = oa["status"] if oa else "N/A"
        implemented = "Yes" if fa else "No"
        
        disc = []
        if not oa and fa:
            disc.append("In code but not in OpenAPI")
        if oa and not fa:
            disc.append("In OpenAPI but not in code")
            
        disc_text = ", ".join(disc) if disc else "None"
        if disc:
            discrepancies.append(f"- **{method.upper()} {path}**: {disc_text}")
            
        table += f"| {method.upper()} | {path} | {op_id} | {status} | {implemented} | {disc_text} |\n"
        
    output_path = Path(r"c:\Users\pbhus\Desktop\Fintech\scripts\reconciliation_report.md")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Endpoint Reconciliation\n\n")
        f.write(table)
        f.write("\n## Discrepancies\n\n")
        f.write("\n".join(discrepancies))
        
    print(f"Generated report at {output_path}")

if __name__ == "__main__":
    main()
