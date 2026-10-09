import re
from pathlib import Path

# Update router.tsx to add RegisterPage
router_path = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\web\src\app\router.tsx")
content = router_path.read_text(encoding="utf-8")

if "RegisterPage" not in content:
    content = content.replace("import { LoginPage } from '@/features/auth/LoginPage';", "import { LoginPage } from '@/features/auth/LoginPage';\nimport { RegisterPage } from '@/features/auth/RegisterPage';")
    register_route = """  {
    path: '/register/:type',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
"""
    content = content.replace("export const router = createBrowserRouter([", "export const router = createBrowserRouter([\n" + register_route)
    router_path.write_text(content, encoding="utf-8")
print("router.tsx patched for RegisterPage.")
