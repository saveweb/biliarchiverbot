FROM node:20-slim AS base
LABEL org.opencontainers.image.source https://github.com/saveweb/biliarchiverbot

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/.svelte-kit/output /app/.svelte-kit/output
EXPOSE 5173

CMD ["pnpm", "dev", "--host", "--port", "5173"]