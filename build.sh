#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing backend dependencies..."
cd api
pip install -r requirements.txt
cd ..

echo "Building frontend..."
cd app
npm install
npm run build
cd ..

echo "Copying frontend build to backend..."
rm -rf api/dist
cp -r app/dist api/dist

echo "Build complete."
