FROM node:14.5-buster

WORKDIR /usr/src/app

# Get the latest master version of the app
RUN git clone https://github.com/ikewai/precipitation_application.git
# Or, use your local version (untested syntax)
#COPY * .

RUN cd precipitation_application; npm install; npm install -g @angular/cli

CMD [ "sleep", "infinity" ]
