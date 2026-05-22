#!/bin/bash

echo "=================================="
echo "Tailwind CSS Fix Verification"
echo "=================================="
echo ""

# Check if postcss.config.js exists
echo "✓ Checking postcss.config.js..."
if [ -f "postcss.config.js" ]; then
    echo "  ✅ postcss.config.js exists"
else
    echo "  ❌ postcss.config.js is missing!"
    exit 1
fi

# Check if globals.css has Tailwind directives at the top
echo ""
echo "✓ Checking globals.css structure..."
if head -10 styles/globals.css | grep -q "@tailwind"; then
    echo "  ✅ @tailwind directives found in first 10 lines"
else
    echo "  ❌ @tailwind directives not at the top of globals.css!"
    exit 1
fi

# Check if all three Tailwind directives are present
echo ""
echo "✓ Checking Tailwind directives..."
if grep -q "@tailwind base" styles/globals.css; then
    echo "  ✅ @tailwind base found"
else
    echo "  ❌ @tailwind base missing!"
    exit 1
fi

if grep -q "@tailwind components" styles/globals.css; then
    echo "  ✅ @tailwind components found"
else
    echo "  ❌ @tailwind components missing!"
    exit 1
fi

if grep -q "@tailwind utilities" styles/globals.css; then
    echo "  ✅ @tailwind utilities found"
else
    echo "  ❌ @tailwind utilities missing!"
    exit 1
fi

# Check if _app.tsx imports globals.css
echo ""
echo "✓ Checking _app.tsx imports..."
if grep -q "globals.css" pages/_app.tsx; then
    echo "  ✅ globals.css imported in _app.tsx"
else
    echo "  ❌ globals.css not imported in _app.tsx!"
    exit 1
fi

# Check if tailwind.config.js exists
echo ""
echo "✓ Checking tailwind.config.js..."
if [ -f "tailwind.config.js" ]; then
    echo "  ✅ tailwind.config.js exists"
else
    echo "  ❌ tailwind.config.js is missing!"
    exit 1
fi

# Check if content paths are configured
echo ""
echo "✓ Checking Tailwind content paths..."
if grep -q "pages/\*\*/\*" tailwind.config.js && grep -q "components/\*\*/\*" tailwind.config.js; then
    echo "  ✅ Content paths configured correctly"
else
    echo "  ⚠️  Warning: Content paths may need verification"
fi

# Check if dependencies are installed
echo ""
echo "✓ Checking dependencies..."
if [ -d "node_modules/tailwindcss" ]; then
    echo "  ✅ tailwindcss installed"
else
    echo "  ❌ tailwindcss not installed!"
    exit 1
fi

if [ -d "node_modules/postcss" ]; then
    echo "  ✅ postcss installed"
else
    echo "  ❌ postcss not installed!"
    exit 1
fi

if [ -d "node_modules/autoprefixer" ]; then
    echo "  ✅ autoprefixer installed"
else
    echo "  ❌ autoprefixer not installed!"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ ALL CHECKS PASSED!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to verify production build"
echo "2. Push changes to trigger Vercel deployment"
echo "3. Clear browser cache after deployment"
echo "4. Verify styles appear correctly in production"
echo ""
