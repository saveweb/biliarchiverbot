FROM --platform=$TARGETARCH node:current-slim AS base
LABEL org.opencontainers.image.source=https://github.com/saveweb/biliarchiverbot

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json ./

FROM base AS deps
RUN pnpm fetch

FROM deps AS prod-deps
RUN pnpm install --prod --offline

FROM deps AS build
COPY . .
RUN pnpm install --offline
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/.svelte-kit/output /app/.svelte-kit/output
EXPOSE 5173
CMD ["pnpm", "vite", "dev", "--host", "--port", "5173"]