package models

type Register struct {
	Nick  string `json:"nick"`
	Name  string `json:"imie"`
	Haslo string `json:"haslo"`
}

type Login struct {
	Nick  string `json:"nick"`
	Haslo string `json:"haslo"`
}
