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

// claude --resume aaff8677-91bc-48ef-aae8-6ac73040677d