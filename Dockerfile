FROM node:12-alpine
WORKDIR /usr/shardwatcher

COPY package.json ./
COPY package-lock.json ./

RUN npm i

COPY . .
CMD [ "npm run", "app" ]