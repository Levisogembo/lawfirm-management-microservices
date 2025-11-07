FROM node:22 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN npm run build

##Production env
FROM  node:22 AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/nest-cli.json ./nest-cli.json

EXPOSE 3000
CMD ["node", "dist/main.js"]