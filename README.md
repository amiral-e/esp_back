## Bun commands

- `bun install` install all dependencies
- `bun run dev` start the development server
- `bun run build` build the project for production
- `bun run format ./ ./src/` format the codebase
- `bun run deploy-dev` deploy the project to development environment
- `bun run deploy-prod` deploy the project to production environment
- `bun --env-file=.env ...` execute bun command using custom env file

## Docker commands

- `docker build -t cc-back-dev .`

To run the container, be sure to expose port `3000`, set environnement variables or use a specific env file.