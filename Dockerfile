FROM node:18

# working directory in the container from which all commands will be run
WORKDIR /usr/src/app

# Copia los archivos de dependencias primero para aprovechar el cache de Docker
COPY package*.json ./

# installs the dependencies in the container
RUN npm install

ENV HOST=0.0.0.0

COPY . .

# Compila el proyecto TypeScript y copia serviceAccountKey.json a dist/
RUN npm run build

EXPOSE 8080

# command to run the application
CMD ["npm", "start"]