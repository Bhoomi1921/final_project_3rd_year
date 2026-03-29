FROM python:3.10.11

# Prevent buffering issues
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy files
COPY . .

# Upgrade pip
RUN pip install --upgrade pip

# Install dependencies
RUN pip install -r requirements.txt

# Start your app (change if needed)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "10000"]