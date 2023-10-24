FROM node:18
WORKDIR /usr/src/app/backend
COPY package*.json ./
RUN npm install -g npm@10.2.1
RUN npm ci
COPY . .


EXPOSE 4000

CMD ["npm", "run", "compile"]

