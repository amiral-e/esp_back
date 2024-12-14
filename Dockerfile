FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

COPY --from=build /app/dist .

EXPOSE 3000

CMD ["bun", "run", "index.js"]