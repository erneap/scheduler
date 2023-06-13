### Stage 1: Build ###
FROM node:20-bullseye-slim as build
WORKDIR /app
COPY ./ /app/
RUN npm install
RUN npm run build

### Stage 2: Run ###
FROM nginx:latest
RUN mkdir -p /usr/share/nginx/html/scheduler
ADD . /data/reports
COPY --from=build /app/dist/scheduler-client /usr/share/nginx/html/scheduler/
COPY --from=build /app/scheduler.conf /etc/nginx/conf.d/scheduler.conf
EXPOSE 8083