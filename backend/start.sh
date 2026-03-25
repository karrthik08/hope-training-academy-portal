#!/bin/bash
set -e

echo "Starting HOPE Training Academy Portal Backend..."
uvicorn main:app --host 0.0.0.0 --port $PORT