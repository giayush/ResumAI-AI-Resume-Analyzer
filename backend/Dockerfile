FROM python:3.11-slim

WORKDIR /app

# Install system deps for psycopg2 and pymupdf
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy English model
RUN python -m spacy download en_core_web_sm

COPY . .

EXPOSE 5000

CMD ["python", "run.py"]
