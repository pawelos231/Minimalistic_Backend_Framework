package models

type Login struct {
	Nick  string `json:"nick"`
	Name  string `json:"imie"`
	Haslo string `json:"haslo"`
}
