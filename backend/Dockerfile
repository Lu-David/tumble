FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    i2c-tools \
    gcc \
    python3-dev \
    sqlite3 \
    libnss3-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make src the runtime root
WORKDIR /app/src

EXPOSE 5000

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5000", "app:app"]