FROM node:24-slim as builder

RUN corepack enable

WORKDIR /app
COPY package.json /app
COPY pnpm-lock.yaml /app
# `COPY . /app` happens after the install, so settings pnpm needs at install
# time have to be copied here as well.
COPY pnpm-workspace.yaml /app
RUN pnpm install --frozen-lockfile

COPY . /app
RUN pnpm lint && pnpm typecheck && pnpm build

FROM public.ecr.aws/lambda/nodejs:24

COPY --from=builder /app/dist/app.js ${LAMBDA_TASK_ROOT}

CMD [ "app.handler" ]
