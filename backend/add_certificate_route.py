import sys

# Read the router file
with open('app/api/v1/router.py', 'r') as f:
    content = f.read()

# Check if certificates already imported
if 'from app.api.v1.endpoints import certificates' not in content:
    # Add import
    import_line = 'from app.api.v1.endpoints import certificates\n'
    
    # Find the last import line
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('from app.api.v1.endpoints import'):
            last_import_idx = i
    
    lines.insert(last_import_idx + 1, import_line.strip())
    
    # Add router include
    router_line = '    api_router.include_router(certificates.router, tags=["certificates"])'
    
    # Find where to add it
    for i, line in enumerate(lines):
        if 'api_router.include_router' in line and 'tags=' in line:
            last_router_idx = i
    
    lines.insert(last_router_idx + 1, router_line)
    
    # Write back
    with open('app/api/v1/router.py', 'w') as f:
        f.write('\n'.join(lines))
    
    print('✅ Certificate route added to router.py')
else:
    print('⚠️  Certificate route already exists')
