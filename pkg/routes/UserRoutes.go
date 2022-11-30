package RoutesArk

import (
	ControllersArk "BackendArkanoid/pkg/controllers"

	"github.com/gorilla/mux"
)

func UserRoutes(r *mux.Router) *mux.Router {
	r.HandleFunc("/handler", ControllersArk.TestHandler())
	return r
}
