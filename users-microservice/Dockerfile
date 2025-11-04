
FROM node:22 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22 AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and minimal runtime files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/nest-cli.json ./nest-cli.json

# Run the compiled app
CMD ["node", "dist/src/main.js"]
    