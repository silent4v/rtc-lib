#source
FROM node:17-alpine as build

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --loglevel=error

COPY . .
RUN yarn run build

# run time
FROM node:17-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/yarn.lock ./
RUN yarn install --production --loglevel=error

COPY --from=build /app/release /app/release
COPY public public

ENV PORT 80
ENV DEBUG "*"

EXPOSE 80

CMD ["node","release/server"]
