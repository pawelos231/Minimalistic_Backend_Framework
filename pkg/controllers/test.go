package ControllersArk

import (
	"encoding/json"
	"net/http"
)

func TestHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET,PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Access-Control-Request-Headers, Access-Control-Request-Method, Connection, Host, Origin, User-Agent, Referer, Cache-Control, X-header, x-access-token")
		var Response = map[string]interface{}{}
		Response["status"] = 1
		Response["message"] = "Udało się opublikować komentarz !"
		json.NewEncoder(w).Encode(Response)
	}
}
