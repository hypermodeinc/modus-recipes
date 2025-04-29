package main

type Product struct {
	Id          string        `json:"id" dgraph:"@id"`
	Title       string        `json:"title"`
	Description *string       `json:"description",omitempty`
	Parts       []ProductPart `json:"parts,omitempty"`
	Category    *Category     `json:"category,omitempty"`
}

type ProductPart struct {
	Name string `json:"name"`
}

type Category struct {
	Name string `json:"name" dgraph:"@id"`
}
