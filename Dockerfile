FROM node:carbon

RUN mkdir /usr/app

WORKDIR /usr/app

# copy app source
ADD . /usr/app/

# Install node-modules
RUN npm install

# Build visualizer
RUN npm run webpack

CMD ["npm", "start"]
