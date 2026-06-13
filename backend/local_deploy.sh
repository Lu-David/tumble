#!/bin/bash

PROJECT=.

cd $PROJECT || exit 1

echo "Pulling latest code..."
git pull origin main

echo "Rebuilding Tumble..."
docker compose -f $PROJECT/docker-compose.local.yml up -d --build