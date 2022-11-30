package ControllersArk

import (
	middlewareArk "BackendArkanoid/pkg/middleware"
	"encoding/json"
	"net/http"
)

func TestHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middlewareArk.CommonMiddleware(w)
		var Response = map[string]interface{}{}
		Response["status"] = 1
		Response["message"] = "Udało się opublikować komentarz !"
		json.NewEncoder(w).Encode(Response)
	}
}
