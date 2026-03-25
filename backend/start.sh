#!/bin/bash
set -e

echo "Starting HOPE Training Academy Portal Backend..."

# Start FastAPI with Uvicorn
uvicorn main:app --host 0.0.0.0 --port 10000