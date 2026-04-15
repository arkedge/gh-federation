FROM node:20-slim as builder

WORKDIR /app
COPY package.json /app
COPY pnpm-lock.yaml /app
RUN pnpm install --frozen-lockfile

COPY . /app
RUN pnpm lint && pnpm typecheck && pnpm build

FROM public.ecr.aws/lambda/nodejs:20

COPY --from=builder /app/dist/app.js ${LAMBDA_TASK_ROOT}

CMD [ "app.handler" ]
