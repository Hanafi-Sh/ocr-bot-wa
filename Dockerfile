# Menggunakan OS dasar Node.js
FROM node:18

# Menginstal library sistem yang dibutuhkan oleh Puppeteer/Chromium di Linux
RUN apt-get update && apt-get install -y \
    gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget

# Menyiapkan folder aplikasi
WORKDIR /app

# Menyalin file package.json dan menginstal library Node.js
COPY package*.json ./
RUN npm install

# Menyalin seluruh kode bot
COPY . .

# Membuka port dan menjalankan bot
EXPOSE 3000
CMD ["node", "index.js"]