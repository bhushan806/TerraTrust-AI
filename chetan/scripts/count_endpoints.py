import json
from pathlib import Path
spec=json.loads(Path(__file__).resolve().parents[1].joinpath("openapi.yaml").read_text())
ops=[(path,method,op) for path,item in spec["paths"].items() for method,op in item.items() if method in {"get","post","put","patch","delete"}]
mvp=sum("MVP" in op.get("tags",[]) for _,_,op in ops)
deferred=sum("Deferred" in op.get("tags",[]) for _,_,op in ops)
print(f"Total operations: {len(ops)}; MVP: {mvp}; deferred: {deferred}")
