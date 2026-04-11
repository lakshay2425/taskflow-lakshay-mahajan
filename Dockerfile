# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Final Runtime
FROM node:24-alpine AS final
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

RUN addgroup -S appgroup && adduser -S -G appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# The entrypoint will handle migrations, and insert seed data before starting the app
CMD ["sh", "-c", "npx knex migrate:latest && npx knex seed:run && npm run dev"]
