FROM alpine
RUN apk add --no-cache nodejs npm uv rclone ffmpeg
WORKDIR /app
COPY requirements.txt .
RUN uv venv && uv pip install -r requirements.txt
COPY .next/standalone/ ./
COPY .next/static/ ./.next/static
COPY public/ ./public
COPY src ./src
ENV PYTHON_BIN=/app/.venv/bin/python
ENV PYTHON_ROOT=/app
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]