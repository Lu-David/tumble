## Raspberry Pi set-up instructions

Install docker
```
curl -fsSL https://get.docker.com | sh
```

```
sudo usermod -aG docker $USER
newgrp docker
```

Verify installation
```
docker --version
docker compose version
docker ps
```

Enable docker automatically on boot
```
sudo systemctl enable docker
sudo systemctl start docker
```

Check status
```
sudo systemctl status docker
```

Authentication
```
ssh-keygen -t ed25519
```

```
ssh-copy-id <USER>@raspberrypi.local
```

## Connect Raspberry PI to Local Network

XFinity steps:
```
1. Enable port-forwarding on your router for ports 443 and 80
2. Make sure you're PI is assigned a static IP address
```