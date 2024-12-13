FROM oven/bun:latest

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

COPY .env .env


EXPOSE 3000

CMD ["bun", "run", "--hot", "src/index.ts"]
