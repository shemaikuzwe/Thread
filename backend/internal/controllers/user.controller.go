package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shemaIkuzwe/thread/internal/db"
)

func GetUserHandler(ctx *gin.Context) {
	id, ok := ctx.Params.Get("id")
	if !ok {
		ctx.JSON(400, gin.H{"error": "id parameter is required"})
		return
	}
	uid, err := uuid.Parse(id)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "invalid id parameter"})
		return
	}
	user, err := db.Db.GetUserById(ctx.Request.Context(), uid)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "failed to get user"})
		return
	}
	ctx.JSON(200, gin.H{
		"id":              user.ID,
		"first_name":      user.FirstName,
		"last_name":       user.LastName,
		"email":           user.Email,
		"profile_picture": user.ProfilePicture,
	})
}

func GetUsersHandler(ctx *gin.Context) {
	users, err := db.Db.GetUsers(ctx.Request.Context())
	if err != nil {
		ctx.JSON(500, gin.H{"error": "failed to get users"})
		return
	}
	ctx.JSON(200, users)
}
