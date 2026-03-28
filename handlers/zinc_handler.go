package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"gofr.dev/pkg/gofr"
	gofrHTTP "gofr.dev/pkg/gofr/http"

	"github.com/ProtPocket/services"
)

// ZincHandler handles GET /zinc?pocket_id=<int> and returns ZINC15 fragment hits for the pocket.
func ZincHandler(ctx *gofr.Context) (interface{}, error) {
	idStr := ctx.Param("pocket_id")
	if idStr == "" {
		return nil, gofrHTTP.ErrorMissingParam{Params: []string{"pocket_id"}}
	}
	pid, err := strconv.Atoi(idStr)
	if err != nil {
		return nil, gofrHTTP.ErrorInvalidParam{Params: []string{"pocket_id"}}
	}

	pocket, ok := DefaultPocketStore.Get(pid)
	if !ok {
		return nil, gofrHTTP.ErrorEntityNotFound{Name: "pocket", Value: fmt.Sprintf("%d", pid)}
	}

	frags, err := services.FetchFragments(pocket)
	if err != nil {
		return nil, HTTPStatusError{
			Code:    http.StatusBadGateway,
			Message: fmt.Sprintf("zinc fetch failed: %v", err),
		}
	}
	return frags, nil
}
