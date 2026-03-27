with open('OnboardingTracker.jsx', 'r') as f:
    content = f.read()

# Replace the handleSave fetch
content = content.replace(
    """await fetch('/api/v1/onboarding/update-item', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_id: trainingId,
          dropbox_link: data.dropbox_link || '',
          initials: data.initials || '',
          notes: data.notes || '',
        })
      })""",
    """await api.post('/onboarding/update-item', {
        training_id: trainingId,
        dropbox_link: data.dropbox_link || '',
        initials: data.initials || '',
        notes: data.notes || '',
      })"""
)

# Replace the handleSubmit fetch
content = content.replace(
    """await fetch('/api/v1/onboarding/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      })""",
    """await api.post('/onboarding/submit', { signature })"""
)

with open('OnboardingTracker.jsx', 'w') as f:
    f.write(content)

print('✅ Fixed remaining fetch calls!')
