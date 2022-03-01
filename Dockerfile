FROM node:14.5-buster

WORKDIR /usr/src/app

COPY / .

RUN npm install
RUN npm install -g @angular/cli

CMD [ "ng", "serve", "--host", "0.0.0.0" ]
