package main

import (
	dgraph_helper "api-go/dgraph-helper"

	_ "github.com/hypermodeinc/modus/sdk/go"
)

const DGRAPH_CONNECTION = "dgraph"

func UpsertProduct(product Product) (string, error) {
	// generate an ID?
	return dgraph_helper.Save(DGRAPH_CONNECTION, product)
}

func GetProduct(id string) (*Product, error) {

	return dgraph_helper.GetByID[Product](DGRAPH_CONNECTION, id)
}
