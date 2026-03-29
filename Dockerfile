FROM python:3.10.11

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# ✅ Install system dependencies (FIX)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0

COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT"]
