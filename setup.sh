#!/bin/bash
# GreenKart — quick environment setup helper

SERVER_ENV="server/.env"

if [ -f "$SERVER_ENV" ]; then
  echo "⚠️  server/.env already exists. Skipping."
else
  cp server/.env.example "$SERVER_ENV"
  echo "✅ Created server/.env from .env.example"
  echo ""
  echo "📝 Open server/.env and fill in:"
  echo "   MONGO_URI        → your MongoDB Atlas connection string"
  echo "   JWT_SECRET       → any long random string"
  echo "   CLOUDINARY_*     → your Cloudinary credentials"
fi

echo ""
echo "🚀 To start development:"
echo "   Terminal 1:  cd server && npm run dev"
echo "   Terminal 2:  cd client && npm run dev"
echo ""
echo "🌍 Frontend: http://localhost:5173"
echo "🔌 Backend:  http://localhost:5000/api/health"
