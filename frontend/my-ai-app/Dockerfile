# --- 第一階段：編譯 React ---
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 第二階段：使用 Nginx 伺服靜態檔案 ---
FROM nginx:alpine
# 將第一階段編譯好的 dist 資料夾，複製到 Nginx 的預設網頁目錄
COPY --from=builder /my-ai-app/dist /usr/share/nginx/html

# 暴露 Nginx 的 80 埠口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]