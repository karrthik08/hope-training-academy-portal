# Read the file
with open('frontend/src/App.jsx', 'r') as f:
    lines = f.readlines()

# Find where to insert (after the admin route)
insert_index = None
for i, line in enumerate(lines):
    if 'path="admin"' in line:
        # Find the closing /> for this route
        j = i
        while j < len(lines):
            if '/>' in lines[j] and 'ProtectedRoute' in lines[j-1]:
                insert_index = j + 1
                break
            j += 1
        break

if insert_index:
    # Routes to add
    new_routes = '''          <Route
            path="onboarding"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/onboarding"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminOnboarding />
              </ProtectedRoute>
            }
          />
'''
    lines.insert(insert_index, new_routes)
    
    # Write back
    with open('frontend/src/App.jsx', 'w') as f:
        f.writelines(lines)
    
    print('✅ Routes added successfully!')
else:
    print('❌ Could not find insertion point')
