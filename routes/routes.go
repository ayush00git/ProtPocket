package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/ProtPocket/handlers"
)

func Register(r *gin.Engine) {
	r.GET("/search", handlers.SearchHandler)

	r.GET("/complex/:id", handlers.ComplexDetailHandler)
	r.GET("/complex/:id/binding-sites", handlers.BindingSiteHandler)

	r.GET("/undrugged", handlers.UndruggedHandler)
	r.GET("/chembl", handlers.ChemblHandler)

	r.POST("/dock", handlers.DockSubmitHandler)
	r.GET("/dock/status", handlers.DockStatusHandler)
}
