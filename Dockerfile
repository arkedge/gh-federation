FROM node:20-slim as builder

WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn

COPY . /app
RUN yarn lint && yarn typecheck && yarn build

FROM public.ecr.aws/lambda/nodejs:20

COPY --from=builder /app/dist/app.js ${LAMBDA_TASK_ROOT}

CMD [ "app.handler" ]
