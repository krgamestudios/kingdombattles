FROM node:15
WORKDIR "/app"
COPY package*.json ./
COPY . /app
RUN npm install --production
EXPOSE 4000
ENTRYPOINT ["bash", "-c"]
CMD ["npm run webpack-production && npm run node"]
