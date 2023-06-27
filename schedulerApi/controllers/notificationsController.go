package controllers

import (
	"fmt"
	"net/http"

	"github.com/erneap/scheduler/schedulerApi/models/dbdata"
	"github.com/erneap/scheduler/schedulerApi/models/web"
	"github.com/erneap/scheduler/schedulerApi/services"
	"github.com/gin-gonic/gin"
)

func GetMessagesForEmployee(c *gin.Context) {
	userid := c.Param("userid")

	if userid == "" {
		resp := &web.NotificationResponse{
			Exception: "No userid given",
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	msgs, err := services.GetMessagesByEmployee(userid)
	fmt.Println(err)
	fmt.Println(msgs)
	if err != nil {
		resp := &web.NotificationResponse{
			Exception: err.Error(),
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	resp := &web.NotificationResponse{
		Messages:  msgs,
		Exception: "",
	}
	c.JSON(http.StatusOK, resp)
}

func GetMessage(c *gin.Context) {
	messageid := c.Param("id")

	if messageid == "" {
		resp := &web.NotificationResponse{
			Exception: "No message id given",
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	msgs, err := services.GetMessage(messageid)
	if err != nil {
		resp := &web.NotificationResponse{
			Exception: err.Error(),
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	var messages []dbdata.Notification
	messages = append(messages, msgs)
	resp := &web.NotificationResponse{
		Messages:  messages,
		Exception: "",
	}
	c.JSON(http.StatusOK, resp)
}

func GetAllMessages(c *gin.Context) {
	msgs, err := services.GetAllMessages()
	if err != nil {
		resp := &web.NotificationResponse{
			Exception: err.Error(),
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	resp := &web.NotificationResponse{
		Messages:  msgs,
		Exception: "",
	}
	c.JSON(http.StatusOK, resp)
}

func CreateMessage(c *gin.Context) {
	var data web.MessageRequest

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.NotificationResponse{
				Exception: err.Error(),
			})
		return
	}

	msg, err := services.CreateMessage(data.To, data.From, data.Message)
	if err != nil {
		resp := &web.NotificationResponse{
			Exception: err.Error(),
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}
	if msg == nil {
		resp := &web.NotificationResponse{
			Exception: "No notification message created",
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	var messages []dbdata.Notification
	messages = append(messages, *msg)
	resp := &web.NotificationResponse{
		Messages:  messages,
		Exception: "",
	}
	c.JSON(http.StatusOK, resp)
}

func AcknowledgeMessages(c *gin.Context) {
	var data web.NotificationAck

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest,
			web.NotificationResponse{
				Exception: err.Error(),
			})
		return
	}

	exceptions := ""
	if len(data.Messages) > 0 {
		for m, msg := range data.Messages {
			err := services.DeleteMessage(msg)
			if err != nil {
				if exceptions != "" {
					exceptions += ";"
				}
				exceptions += fmt.Sprintf("Message %d: %s", m, err.Error())
			}
		}
	}
	if exceptions != "" {
		resp := &web.NotificationResponse{
			Exception: exceptions,
		}
		c.JSON(http.StatusBadRequest, resp)
		return
	}
	c.Status(http.StatusOK)
}
