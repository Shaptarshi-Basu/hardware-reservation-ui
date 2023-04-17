# base image
FROM node:16-alpine

# set working directory
WORKDIR /app

# install app dependencies
COPY package*.json ./
RUN npm install

# add app files
COPY . .

# expose port
EXPOSE 3000

# start app
CMD ["npm", "start"]
