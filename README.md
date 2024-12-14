To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000


# Build image docker

- docker build -t esp_back .

# Run app with image

docker run -p 3000:3000 --env-file .env -v $(pwd):/app esp_back
