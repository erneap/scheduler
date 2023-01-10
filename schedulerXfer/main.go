package main

import (
	"fmt"

	"github.com/erneap/scheduler/schedulerXfer/converters"
	"github.com/erneap/scheduler/schedulerXfer/models/config"
)

func main() {
	fmt.Println("Starting")

	config.ConnectDB()

	fmt.Println("Copying Users")
	userConvert := converters.UserConverter{}
	userConvert.ReadUsers()
	userConvert.WriteUsers()
}
