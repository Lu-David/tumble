# 🧺 Tumble - Laundry Machine IoT Monitor for laundry events 

- Flask API running on Raspberry Pi
- MPU6050 vibration sensing (to detect when dryer is on or off)
- React dashboard
- Public HTTPS API via DuckDNS + Let’s Encrypt

---
# Local Development

You can quickly run both backend and frontend 
```
TODO
```

```
TODO
```

---

# 🌐 System Architecture

```txt
React (GitHub Pages)
        ↓
https://goss304.duckdns.org
        ↓
Nginx (port 80 / 443)
        ↓
Flask app (localhost:5000)
        ↓
MPU6050 sensor (Raspberry Pi)


