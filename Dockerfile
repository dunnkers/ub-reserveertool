# specify the node base image with your desired version node:<version>
FROM node:12

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .


# replace this with your application's default port
EXPOSE 3001

CMD [ "yarn", "start" ]