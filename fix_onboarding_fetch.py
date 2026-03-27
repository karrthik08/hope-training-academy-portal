import re

# Read the file
with open('frontend/src/pages/participant/OnboardingTracker.jsx', 'r') as f:
    content = f.read()

# Add import at top if not exists
if "import api from '../../api/client'" not in content:
    content = content.replace(
        "import { useAuthStore } from '../../store/authStore'",
        "import { useAuthStore } from '../../store/authStore'\nimport api from '../../api/client'"
    )

# Remove token variable since api client handles it
content = re.sub(r"const token = localStorage\.getItem\('hope_access_token'\) \|\| ''", "", content)

# Replace fetch with api.get
content = content.replace(
    "fetch('/api/v1/onboarding/trainings', { headers: { Authorization: `Bearer ${token}` } }),",
    "api.get('/onboarding/trainings'),"
)

content = content.replace(
    "fetch('/api/v1/onboarding/my-progress', { headers: { Authorization: `Bearer ${token}` } }),",
    "api.get('/onboarding/my-progress'),"
)

# Replace Promise.all response handling
content = content.replace(
    """const tData = await tRes.json()
      const pData = await pRes.json()""",
    """const tData = tRes.data
      const pData = pRes.data"""
)

# Replace POST fetch calls
content = re.sub(
    r"await fetch\('/api/v1/onboarding/update-item', \{[^}]+method: 'POST',[^}]+headers: \{[^}]+\},[^}]+body: JSON\.stringify\(payload\)[^}]+\}\)",
    "await api.post('/onboarding/update-item', payload)",
    content
)

content = re.sub(
    r"await fetch\('/api/v1/onboarding/submit', \{[^}]+method: 'POST',[^}]+headers: \{[^}]+\},[^}]+body: JSON\.stringify\(\{ signature \}\)[^}]+\}\)",
    "await api.post('/onboarding/submit', { signature })",
    content
)

# Write back
with open('frontend/src/pages/participant/OnboardingTracker.jsx', 'w') as f:
    f.write(content)

print('✅ OnboardingTracker.jsx updated to use API client!')
