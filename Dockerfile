FROM node:18

# working directory in the container from which all commands will be run
WORKDIR /usr/src/app

# Copia los archivos de dependencias primero para aprovechar el cache de Docker
COPY package*.json ./

# installs the dependencies in the container
RUN npm install

ENV HOST=0.0.0.0
ENV PORT=8080

COPY . .

# Compila el proyecto TypeScript y copia serviceAccountKey.json a dist/
RUN npm run build

# Verify the build output
RUN ls -la dist/

EXPOSE 8080

# Add debugging
ENV NODE_ENV=production

# command to run the application
CMD ["node", "dist/index.js"]