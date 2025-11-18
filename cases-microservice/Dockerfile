FROM public.ecr.aws/docker/library/node:22 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN npm run build

##Production env
FROM  public.ecr.aws/docker/library/node:22 AS runner

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/main.js"]