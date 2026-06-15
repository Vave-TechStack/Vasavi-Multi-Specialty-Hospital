FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
COPY prisma ../prisma
RUN npm run prisma:generate && npm run build
EXPOSE 4000
CMD ["sh","-c","npx prisma db push --schema ../prisma/schema.prisma --skip-generate && npm start"]
