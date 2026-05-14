package main

import (
	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/routes"
)

func main() {
	r := gin.Default()
	routes.Register(r)
	r.Run()
}
