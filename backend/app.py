import os
import urllib.request
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from keras.models import load_model
from keras.utils import load_img, img_to_array
from keras.applications.vgg16 import preprocess_input

# 1. 初始化 FastAPI 應用程式
app = FastAPI(title="Bo Door Security AI API", description="單體式架構 AI 辨識後端")

# 2. 🛡️ 設定 CORS 跨網域存取 (非常重要！否則前端 HTML 會被瀏覽器擋下來)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 課堂演示先開全開放，允許任何前端網頁呼叫
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. 🧠 一開機就載入親手孕育的 AI 大腦 (.keras 檔案請確保放在同一個資料夾)
MODEL_PATH = "bo_door_model.keras"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"找不到模型檔案：{MODEL_PATH}，請確認檔案位置！")

print("正在喚醒 AI 大腦...")
model = load_model(MODEL_PATH)
print("AI 大腦載入成功，準備就緒！")


# 4. 📐 影像預處理安檢門 (不依賴 matplotlib，純 Keras + Pillow 核心)
def ai_image_pipeline(target_path):
    # 縮放成 VGG16 指定的 224x224
    img = load_img(target_path, target_size=(224, 224))
    # 轉成 3D 矩陣 (224, 224, 3)
    img_array = img_to_array(img)
    # 升維成 4D 批次矩陣 (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)
    # 顏色校正
    ready_image = preprocess_input(img_array)
    return ready_image


# 5. 🔮 核心 AI 預測邏輯 (傳入處理好的矩陣，回傳白話文結果)
def model_inference(processed_matrix):
    prediction = model.predict(processed_matrix)
    # 以 0 分作為楚河漢界
    if prediction[0] < 0:
        return "It's Bo! Come on in! ❤️"
    else:
        return "You are NOT Bo! Go away! ❌"


# 定义方法一所需的 JSON 資料格式
class UrlInput(BaseModel):
    image_url: str


# ==================== 🛠️ API 路由設定 ====================

@app.get("/")
def home():
    return {"status": "online", "message": "歡迎來到 AWS AI 單體式後端伺服器"}


# 【方法一】：接收前端傳來的圖片網址 (JSON POST)
@app.post("/predict/url")
async def predict_by_url(payload: UrlInput):
    temp_filename = "temp_downloaded_image.jpg"
    try:
        # 下載網路圖片並暫存
        urllib.request.urlretrieve(payload.image_url, temp_filename)
        
        # 丟進 AI 管線處理並預測
        processed_image = ai_image_pipeline(temp_filename)
        result_text = model_inference(processed_image)
        
        return {"result": result_text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"網址解析或下載失敗: {str(e)}")
    finally:
        # 刪除暫存檔保持伺服器乾淨
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


# 【【整合路由】：同時支援你前端設計的方法一與方法二
@app.post("/predict")
async def predict(
    file: UploadFile = File(None), 
    payload: UrlInput = None
):
    temp_filename = "temp_api_image.jpg"
    try:
        # 情境 A：前端上傳了真實圖片檔案 (方法二)
        if file is not None:
            contents = await file.read()
            with open(temp_filename, "wb") as f:
                f.write(contents)
        
        # 情境 B：前端傳來的是網址（如果是從 JSON 傳來，需要手動支援，通常分開兩個路由最乾淨）
        # 為了完美相容你剛才的 HTML 前端 fetch 邏輯，我們通常在前端區分 /predict 路由。
        # 這裡示範最常見的實體檔案接收：
        else:
            raise HTTPException(status_code=400, detail="未偵測到上傳的檔案")

        # 影像過安檢門與推論
        processed_image = ai_image_pipeline(temp_filename)
        result_text = model_inference(processed_image)
        
        return {"result": result_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"伺服器內部錯誤: {str(e)}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)