package main

import (
	RoutesArk "BackendArkanoid/pkg/routes"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

const PORT = ":8081"

func main() {
	router := mux.NewRouter()
	http.Handle("/", RoutesArk.UserRoutes(router))
	fmt.Printf("Starting server at port 8081\n")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal(err)
	}
}
