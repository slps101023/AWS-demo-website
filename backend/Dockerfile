# 使用官方輕量版 Python
FROM python:3.10-slim

# 設定容器內的工作目錄
WORKDIR /app

# 複製依賴清單並安裝
COPY requirements.txt .
# 💡 核心改良：設定 --default-timeout=1000 延長等待時間
# 💡 如果人在台灣/大陸，可以順便加上台灣大學或清華大學的鏡像加速（下載速度會從 100K 飆到幾十MB）
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# 複製後端所有程式碼到容器內
COPY . .

# 暴露 FastAPI 預設的 8000 埠口
EXPOSE 8000

# 啟動 FastAPI (請根據你實際的檔名與 app 名稱調整，這裡假設是 main:app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]