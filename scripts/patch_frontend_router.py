import os
import re
from pathlib import Path

# Update router.tsx
router_path = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\web\src\app\router.tsx")
content = router_path.read_text(encoding="utf-8")

# Add import for HomePage
content = content.replace("import { LoginPage } from '@/features/auth/LoginPage';", "import { LoginPage } from '@/features/auth/LoginPage';\nimport { HomePage } from '@/features/public/HomePage';")

# Replace AppShell path '/' with '/officer'
# Be careful: `path: '/',` is used for the main shell.
content = re.sub(
    r"path:\s*'/',\s*element:\s*\(\s*<RequireAuth>",
    "path: '/officer',\n    element: (\n      <RequireAuth>",
    content
)

# Insert the HomePage route at the beginning of the array
home_page_route = """  {
    path: '/',
    element: (
      <PublicOnlyRoute>
        <HomePage />
      </PublicOnlyRoute>
    ),
  },
"""
content = content.replace("export const router = createBrowserRouter([", "export const router = createBrowserRouter([\n" + home_page_route)

# Now we need to add the /farmer portal placeholder
farmer_portal = """
  {
    path: '/farmer',
    element: (
      <RequireAuth>
        <ErrorBoundary>
          <div className="min-h-screen bg-slate-50 p-8">
            <h1 className="text-3xl font-bold">Farmer Portal</h1>
            <p>Welcome to the farmer portal.</p>
          </div>
        </ErrorBoundary>
      </RequireAuth>
    ),
  },
"""
content = content.replace("/* Public 404 fallback */", farmer_portal + "\n  /* Public 404 fallback */")

router_path.write_text(content, encoding="utf-8")


# Update Sidebar.tsx
sidebar_path = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\web\src\components\layout\Sidebar.tsx")
sidebar_content = sidebar_path.read_text(encoding="utf-8")
# We need to prepend /officer to all NavLink `to` props that start with `/`
# EXCEPT if they are `to="/"` we make it `to="/officer"`
sidebar_content = sidebar_content.replace('to="/"', 'to="/officer"')
sidebar_content = re.sub(r'to="/([^"]+)"', r'to="/officer/\1"', sidebar_content)
sidebar_path.write_text(sidebar_content, encoding="utf-8")

print("router.tsx and Sidebar.tsx patched.")
