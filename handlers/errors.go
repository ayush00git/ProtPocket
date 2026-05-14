package handlers

import "net/http"

type HTTPStatusError struct {
	Code    int
	Message string
}

func (e HTTPStatusError) Error() string {
	return e.Message
}

func (e HTTPStatusError) StatusCode() int {
	if e.Code == 0 {
		return http.StatusInternalServerError
	}
	return e.Code
}
