FROM debian:bookworm AS build

RUN apt-get update && apt-get install -y curl python3 unzip
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH=/root/.bun/bin:$PATH

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