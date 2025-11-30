package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shemaIkuzwe/thread/internal/database"
	"github.com/shemaIkuzwe/thread/internal/db"
)

func SubscripeUserHandler(ctx *gin.Context) {
	user, err := GetCurrentUser(ctx)
	if err != nil {
		log.Println("failed to get current user: ", err)
		ctx.JSON(http.StatusBadRequest, "Failed to get current user")
		return
	}
	userID, err := uuid.Parse(user.Id)
	if err != nil {
		log.Println("Error parsing uuid", err)
		ctx.JSON(http.StatusBadRequest, "Failed to parse userID")
		return
	}
	var body struct {
		Sub webpush.Subscription `json:"sub"`
	}
	err = ctx.ShouldBind(&body)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, "Invalid body")
		return
	}
	sub, err := json.Marshal(body.Sub)
	if err != nil {
		log.Println("failed to get raw data")
		return
	}
	err = db.Db.CreateSubscription(ctx.Request.Context(), database.CreateSubscriptionParams{
		UserID:   userID,
		Endpoint: body.Sub.Endpoint,
		Sub:      sub,
	})
	if err != nil {
		log.Println("Failed to create subscrption: ", err)
		ctx.JSON(http.StatusInternalServerError, "Failed to create subscription")
		return
	}
	ctx.JSON(http.StatusOK, "Subscription created successfully")
}

func UnSubscripeUserHandler(ctx *gin.Context) {
	user, err := GetCurrentUser(ctx)
	if err != nil {
		log.Println("failed to get current user: ", err)
		ctx.JSON(http.StatusBadRequest, "Failed to get current user")
		return
	}
	userID, err := uuid.Parse(user.Id)
	if err != nil {
		log.Println("Error parsing uuid", err)
		ctx.JSON(http.StatusBadRequest, "Failed to parse userID")
		return
	}
	endpoint, ok := ctx.Params.Get("endpoint")
	if !ok || endpoint == "" {
		ctx.JSON(http.StatusBadRequest, "Invalid or no endpoint")
		return
	}
	err = db.Db.UnSubscribeUser(ctx.Request.Context(), database.UnSubscribeUserParams{
		Endpoint: endpoint,
		UserID:   userID,
	})
	if err != nil {
		log.Println("Failed to create subscrption: ", err)
		ctx.JSON(http.StatusInternalServerError, "Failed to create subscription")
		return
	}
	ctx.JSON(http.StatusOK, "Subscription created successfully")
}

func sendNotification(
	message []byte,
	title string,
	userID uuid.UUID,
) error {
	subs, err := db.Db.GetUserSubscription(context.Background(), userID)
	if err != nil {
		return fmt.Errorf("No subscription available: %s", err)
	}
	for _, subscription := range subs {
		var sub webpush.Subscription
		err := json.Unmarshal(subscription.Sub, &sub)
		if err != nil {
			return err
		}
		log.Println("sending notification", string(message), title)
		res, err := webpush.SendNotification(
			[]byte("Test"),
			&sub,
			&webpush.Options{
				VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
				VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
				Urgency:         webpush.UrgencyHigh,
			},
		)
		if err != nil {
			return err
		}
		defer res.Body.Close()
	}
	return nil
}
func SendThreadNotification(message []byte) error {
	var msg Message
	if err := json.Unmarshal(message, &msg); err != nil {
		return err
	}
	users, err := getThreadUsers(msg.ThreadID)
	if err != nil {
		return err
	}
	for _, user := range users {
		err := sendNotification([]byte(msg.Message), "New", user)
		if err != nil {
			log.Println("error sending notification: ", err)
			continue
		}
	}
	return nil
}
func getThreadUsers(thread string) ([]uuid.UUID, error) {
	threadID, err := uuid.Parse(thread)
	if err != nil {
		return nil, err
	}
	users, err := db.Db.GetThreadUsers(context.Background(), threadID)
	if err != nil {
		return nil, err
	}
	return users, nil
}
