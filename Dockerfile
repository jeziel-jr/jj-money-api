FROM node:18.18

RUN apt update
RUN apt install lsof
RUN npm install -g ts-node
RUN npm install -g prisma

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT [ "npm", "run", "start" ]