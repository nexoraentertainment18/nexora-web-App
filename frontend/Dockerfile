# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_TARGET=http://backend:8081
ENV VITE_API_TARGET=${VITE_API_TARGET}

ARG VITE_TMDB_BEARER_TOKEN
ENV VITE_TMDB_BEARER_TOKEN=${VITE_TMDB_BEARER_TOKEN}

ARG VITE_OMDB_API_KEY
ENV VITE_OMDB_API_KEY=${VITE_OMDB_API_KEY}

# For EC2/public deployment, set VITE_API_TARGET to the backend public IP:port, e.g. http://16.16.201.73:8081
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
