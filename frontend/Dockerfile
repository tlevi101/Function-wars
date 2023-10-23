FROM node:18
WORKDIR /usr/src/app/frontend
COPY package*.json ./
RUN npm install -g npm@10.2.1
RUN npm install -g @angular/cli
RUN npm ci


EXPOSE 4200

CMD ng serve --host 0.0.0.0 --port 4200