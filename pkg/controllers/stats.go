package ControllersArk

import (
	middlewareArk "BackendArkanoid/pkg/middleware"
	"encoding/json"
	"net/http"
)

func FindBestPlayers() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middlewareArk.CommonMiddleware(w)
		tab := [6]string{"maciek", "seba", "pawelos", "nie", "szesc", "hihi"}
		json.NewEncoder(w).Encode(tab)
	}
}
