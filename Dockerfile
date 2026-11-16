FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py identity.py auth_config.py shared_store.py ./
COPY dist ./dist
COPY data/example.json ./data/example.json
ENV HOST=0.0.0.0 PORT=8080 DATA_DIR=/data PYTHONUNBUFFERED=1
VOLUME ["/data"]
EXPOSE 8080
CMD ["python", "server.py"]
