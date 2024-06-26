FROM --platform=$TARGETARCH node:18-alpine AS base
LABEL org.opencontainers.image.source=https://github.com/saveweb/biliarchiverbot

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json ./
FROM base AS deps
RUN pnpm fetch

FROM deps AS build
COPY . .
RUN pnpm install --offline

ENV BILIARCHIVER_WEBAPP=https://example.com/
ENV BILIARCHIVER_USERNAME=example
ENV BILIARCHIVER_API=https://example.com/
ENV BILIARCHIVER_BOT=example

RUN pnpm run build

FROM base
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/.svelte-kit /app/.svelte-kit
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=3 --spider http://127.0.0.1:5173/favicon.png || exit 1

CMD ["pnpm", "dev", "--host", "--port", "5173"]
