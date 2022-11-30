package main

import (
	ControllersArk "BackendArkanoid/pkg/controllers"
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/handler", ControllersArk.TestHandler())
	fmt.Printf("Starting server at port 8081\n")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal(err)
	}
}
