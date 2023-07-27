FROM node:16.0.0-buster

WORKDIR /usr/src/app

COPY / .

RUN npm install
RUN npm install -g @angular/cli@10.0.3

CMD [ "ng", "serve", "--host", "0.0.0.0" ]
