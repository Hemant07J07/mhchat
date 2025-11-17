# Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system packages (for psycopg2 and build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev gettext curl \
  && rm -rf /var/lib/apt/lists/*

# copy and install requirements first (speeds rebuilds)
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# copy project
COPY . /app

# collect static (no-op if you don't use staticfiles)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# use a small wrapper so container can run migrations then start Daphne
ENTRYPOINT ["sh", "-c"]
CMD ["python manage.py migrate --noinput && daphne -b 0.0.0.0 -p 8000 mhchat_proj.asgi:application"]
