# Website + API in one container:  docker build -t shafare .  &&  docker run -p 8787:8787 -v shafare-data:/data --env-file .env shafare
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787 DATA_DIR=/data
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
VOLUME /data
EXPOSE 8787
CMD ["node", "server/index.js"]
