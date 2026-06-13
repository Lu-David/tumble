#!/bin/bash
set -e

# ===== CONFIG =====
PI_USER=ludavidyi
PI_HOST=raspberrypi.local
PI_PATH=/opt/tumble
COMPOSE_FILE=docker-compose.remote.yml

echo "==== Creating app directory on Raspberry Pi ===="

ssh -t ${PI_USER}@${PI_HOST} "
sudo mkdir -p ${PI_PATH}
sudo chown -R ${PI_USER}:${PI_USER} ${PI_PATH}
"

echo "==== Syncing files to Raspberry Pi ===="

rsync -av --delete \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='.venv' \
  ./ ${PI_USER}@${PI_HOST}:${PI_PATH}/

echo "==== Running remote deploy on Raspberry Pi ===="

ssh -t ${PI_USER}@${PI_HOST} << EOF
set -e

cd ${PI_PATH}

echo "Current directory:"
pwd

echo "Files deployed:"
ls -lah

echo "Checking compose file..."
test -f ${COMPOSE_FILE}

echo "Enabling I2C..."

sudo raspi-config nonint do_i2c 0 || true
sudo modprobe i2c-dev || true
sudo modprobe i2c-bcm2835 || true

echo "Verifying I2C bus..."
ls /dev/i2c* || true

echo "Deploying Docker container..."

sudo docker compose -f ${COMPOSE_FILE} down || true
sudo docker compose -f ${COMPOSE_FILE} up -d --build

echo "Deployment complete!"
sudo docker ps
EOF

echo "==== Done ===="