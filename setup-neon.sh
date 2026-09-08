#!/bin/bash
# ============================================
# IP-SAKTI Sahayak — Neon Setup Script
# Run this on your local machine after cloning
# ============================================

echo "🚀 Setting up Neon for IP-SAKTI Sahayak..."
echo ""

# Step 1: Install Neon CLI
echo "Step 1: Installing Neon CLI..."
npm i -g neon@latest

# Step 2: Login to Neon
echo ""
echo "Step 2: Logging into Neon (opens browser)..."
neon login

# Step 3: Setup skills and MCP
echo ""
echo "Step 3: Setting up Neon skills..."
neon skills -y 2>/dev/null || echo "Skills setup skipped (run manually if needed)"
neon mcp -y 2>/dev/null || echo "MCP setup skipped (run manually if needed)"

# Step 4: Link project
echo ""
echo "Step 4: Linking Neon project..."
neon link --project-id withered-hall-59779382 --branch production -y

# Step 5: Init config
echo ""
echo "Step 5: Initializing Neon config..."
neon config init

# Step 6: Get connection string and update .env
echo ""
echo "Step 6: Getting connection string..."
CONN_STRING=$(neon connection-string --project-id withered-hall-59779382 2>/dev/null)
if [ -n "$CONN_STRING" ]; then
  echo "DATABASE_URL=$CONN_STRING" > .env.neon
  echo "✅ Connection string saved to .env.neon"
  echo "   Add it to your .env file or Vercel environment variables"
else
  echo "⚠️  Could not get connection string automatically."
  echo "   Get it from: https://console.neon.tech/app/projects/withered-hall-59779382"
fi

# Step 7: Deploy
echo ""
echo "Step 7: Ready to deploy!"
echo ""
echo "To deploy to Neon:"
echo "  neon deploy"
echo ""
echo "To push database schema:"
echo "  npx drizzle-kit push"
echo ""
echo "To seed the knowledge base:"
echo "  curl -X POST https://your-app.vercel.app/api/seed"
echo ""
echo "✅ Setup complete!"
