# specify the base image to be used for this application
FROM golang:1.19.4-alpine3.17

# create a working directory inside the image
WORKDIR /app

# copy the go modules and dependencies
COPY go.mod ./

# download necessary GO modules and dependencies
RUN go mod download

# copy the the files to the directory
COPY . .

# compile the application
RUN go build -o /schedulerApi

# add directory for reports to be stored and mounted with compose
ADD . /data/reports

# expose the network port for runtime access
EXPOSE 4000

# command used to execute the api 
CMD [ "/schedulerApi" ]