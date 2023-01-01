package ControllersArk

import (
	middlewareArk "BackendArkanoid/pkg/middleware"
	"BackendArkanoid/pkg/models"
	"encoding/json"
	"fmt"
	"net/http"
)

func RegisterHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		middlewareArk.CommonMiddleware(w)

		var RegisterInfo models.Register
		json.NewDecoder(req.Body).Decode(&RegisterInfo)
		fmt.Println(RegisterInfo)

		var Response = map[string]interface{}{}
		Response["status"] = 1
		Response["message"] = "Udało się Zarejestrować!"
		json.NewEncoder(w).Encode(Response)
	}
}

func LoginHandler() http.HandlerFunc {
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
