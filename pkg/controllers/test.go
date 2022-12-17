package ControllersArk

import (
	middlewareArk "BackendArkanoid/pkg/middleware"
	"BackendArkanoid/pkg/models"
	"encoding/json"
	"fmt"
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

func RegisterHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		middlewareArk.CommonMiddleware(w)

		var loginInfo models.Login
		json.NewDecoder(req.Body).Decode(&loginInfo)
		fmt.Println(loginInfo)

		var Response = map[string]interface{}{}
		Response["status"] = 1
		Response["message"] = "Udało się zalogować!"
		json.NewEncoder(w).Encode(Response)
	}
}
