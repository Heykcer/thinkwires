FROM python:3.11-slim

WORKDIR /app

# Create unprivileged application user
RUN groupadd -g 1001 aiapp && useradd -u 1001 -g aiapp -m aiapp

# Install curl for health check probe
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R aiapp:aiapp /app

USER aiapp

ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:8000/health || exit 1

CMD ["python", "main.py"]
