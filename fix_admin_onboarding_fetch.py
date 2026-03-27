import re

# Read the file
with open('frontend/src/pages/admin/OnboardingTracker.jsx', 'r') as f:
    content = f.read()

# Add import at top if not exists
if "import api from '../../api/client'" not in content:
    # Find the last import line
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('import') and i < 10:
            last_import = i
    lines.insert(last_import + 1, "import api from '../../api/client'")
    content = '\n'.join(lines)

# Remove token variable
content = re.sub(r"const token = localStorage\.getItem\('hope_access_token'\) \|\| ''", "", content)

# Replace all fetch('/api/v1/... with api.get or api.post
content = re.sub(
    r"fetch\('/api/v1/onboarding/admin/all-progress', \{ headers: \{ Authorization: `Bearer \$\{token\}` \} \}\)",
    "api.get('/onboarding/admin/all-progress')",
    content
)

# Replace response.json() with response.data
content = content.replace('await res.json()', 'res.data')
content = content.replace('const data = await res.json()', 'const data = res.data')

# Replace POST requests
content = re.sub(
    r"fetch\('/api/v1/onboarding/admin/approve/\$\{userId\}', \{[^}]*method: 'POST'[^}]*\}\)",
    "api.post(`/onboarding/admin/approve/${userId}`)",
    content
)

# Write back
with open('frontend/src/pages/admin/OnboardingTracker.jsx', 'w') as f:
    f.write(content)

print('✅ Admin OnboardingTracker.jsx updated!')
