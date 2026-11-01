# GunRun 2D - Dockerfile de Producción
FROM python:3.11-slim

# Prevenir escritura de archivos .pyc y forzar buffer directo en stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema requeridas para compilación criptográfica
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente completo del proyecto (backend y frontend estático)
COPY . .

# Exponer el puerto de producción del servidor WSGI
EXPOSE 5000

# Healthcheck de contenedor
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/api/health || exit 1

# Entrypoint en modo producción (Waitress WSGI multihilo)
CMD ["python", "backend/run.py", "--prod"]

