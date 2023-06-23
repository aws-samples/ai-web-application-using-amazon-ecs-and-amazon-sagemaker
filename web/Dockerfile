FROM node:18

WORKDIR /app
COPY package*.json /

RUN npm install -g nodemon
RUN npm install

COPY ./app /app

CMD [ "nodemon", "app.js" ]