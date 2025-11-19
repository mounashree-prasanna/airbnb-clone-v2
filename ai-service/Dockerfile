# ---------- Base Image ----------
FROM python:3.11-slim

    # ---------- Working Directory ----------
WORKDIR /app
    
    # ---------- Copy and Install Dependencies ----------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
    
    # ---------- Copy Application Code ----------
COPY app ./app
    
    # ---------- Environment Variables ----------
ENV PORT=7005
ENV PYTHONUNBUFFERED=1
    
    # ---------- Expose Port ----------
EXPOSE 7005
    
    # ---------- Command ----------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7005"]
    