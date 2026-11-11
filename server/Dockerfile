# API de Danny Tacos. El contexto de build es la RAÍZ del repo (no /server)
# porque migrate/seed leen ../migrations. Ver docker-compose.yml.
FROM node:22-slim
WORKDIR /app/server

COPY server/package*.json ./
# Se instalan también las devDependencies: tsx (migrate/seed) y typescript (build).
RUN npm ci

COPY server/ ./
COPY migrations/ /app/migrations/
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "docker-entrypoint.sh"]
