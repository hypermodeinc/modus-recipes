package dgraph_helper

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/console"
	"github.com/hypermodeinc/modus/sdk/go/pkg/dgraph"
)

// ToRDF generates an RDF string from an object using struct tags.
// Example struct with RDF tags
//
//	type Person struct {
//		ID   string `dgraph:"@id"` // Mark ID field with dgraph:"@id"
//		Name string
//		Age  int
//	}
func ToRDF(obj interface{}, uid_index int) (string, string, error) {
	val := reflect.ValueOf(obj)
	if val.Kind() != reflect.Struct {
		return "", "", fmt.Errorf("expected a struct, got %T", obj)
	}

	typ := val.Type()
	_, idValue := idFieldValue(val)
	if idValue == "" {
		idValue = fmt.Sprintf("%v", uid_index)
	}

	var rdfBuilder strings.Builder
	identifier := fmt.Sprintf("<_:%s_%s>", typ.Name(), idValue)
	rdfBuilder.WriteString(fmt.Sprintf("%s <dgraph.type> \"%v\" .\n", identifier, typ.Name()))

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldValue := val.Field(i)

		// Get JSON tag if present, otherwise use field name
		fieldName := getJSONFieldName(field)

		// If pointer, check for nil and dereference
		for fieldValue.Kind() == reflect.Ptr {
			if fieldValue.IsNil() {
				goto nextField
			}
			fieldValue = fieldValue.Elem()
		}

		switch fieldValue.Kind() {
		case reflect.String, reflect.Int, reflect.Float64, reflect.Bool:
			valueStr := fmt.Sprintf("%v", fieldValue.Interface())

			// Escape using strconv.Quote and strip the wrapping quotes
			escaped := strconv.Quote(valueStr)
			escaped = escaped[1 : len(escaped)-1]
			rdfBuilder.WriteString(fmt.Sprintf("%s <%s.%s> \"%v\" .\n",
				identifier, typ.Name(), fieldName, escaped))

		case reflect.Struct:
			if !hasIDField(fieldValue.Type()) {
				nestedRDF, nestedID, err := ToRDF(fieldValue.Interface(), uid_index)
				if err != nil {
					return "", "", err
				}
				rdfBuilder.WriteString(fmt.Sprintf("%s <%s.%s> %s .\n",
					identifier, typ.Name(), fieldName, nestedID))
				rdfBuilder.WriteString(nestedRDF)
			}

		case reflect.Slice:
			if fieldValue.Len() == 0 {
				goto nextField
			}
			elemType := fieldValue.Type().Elem()
			for j := 0; j < fieldValue.Len(); j++ {
				elemValue := fieldValue.Index(j)

				// Support slice of pointers
				for elemValue.Kind() == reflect.Ptr {
					if elemValue.IsNil() {
						goto nextSliceItem
					}
					elemValue = elemValue.Elem()
				}

				if !hasIDField(elemType) {
					nestedRDF, nestedID, err := ToRDF(elemValue.Interface(), uid_index)
					if err != nil {
						return "", "", err
					}
					rdfBuilder.WriteString(fmt.Sprintf("%s <%s.%s> %s .\n",
						identifier, typ.Name(), fieldName, nestedID))
					rdfBuilder.WriteString(nestedRDF)
					uid_index++
				}
			nextSliceItem:
			}
		}
	nextField:
		uid_index++
	}

	return rdfBuilder.String(), identifier, nil
}
func hasIDField(objType reflect.Type) bool {
	return (idField(objType) != "")
}

func idField(objType reflect.Type) string {
	for i := 0; i < objType.NumField(); i++ {
		field := objType.Field(i)
		tagValue := field.Tag.Get("dgraph")
		if tagValue == "@id" {
			return getJSONFieldName(field)
		}
	}
	return ""
}

func idFieldValue(obj reflect.Value) (string, string) {
	if obj.Kind() != reflect.Struct {
		return "", ""
	}
	for i := 0; i < obj.Type().NumField(); i++ {
		field := obj.Type().Field(i)
		tagValue := field.Tag.Get("dgraph")
		if tagValue == "@id" {
			return field.Name, fmt.Sprintf("%v", obj.Field(i).Interface())
		}
	}
	return "", ""
}

// GenerateDeleteRDF creates RDF deletion triples for an object type based on scalar fields.
// It also generates a query string to locate the node to delete.
func GenerateDeleteRDF(id string, objType reflect.Type) (deleteRDF string, query string, err error) {
	if objType.Kind() != reflect.Struct {
		return "", "", fmt.Errorf("expected a struct type, got %s", objType.Name())
	}

	var idFieldName string
	var idFieldFound bool
	var rdfBuilder strings.Builder
	var queryBuilder strings.Builder

	// Identify the ID field using dgraph:"@id" tag
	for i := 0; i < objType.NumField(); i++ {
		field := objType.Field(i)
		if field.Tag.Get("dgraph") == "@id" {
			idFieldName = getJSONFieldName(field)
			idFieldFound = true
			break
		}
	}

	if !idFieldFound {
		return "", "", fmt.Errorf("no field with tag dgraph:\"@id\" found")
	}
	queryBuilder.WriteString(fmt.Sprintf("query { n as var(func: eq(<%s.%s>, \"%s\")) {", objType.Name(), idFieldName, id))
	// Create query string for locating the node to delete

	rdfBuilder.WriteString("uid(n) <dgraph.type> * .\n")
	// Generate RDF deletion statements for each scalar field
	for i := 0; i < objType.NumField(); i++ {
		field := objType.Field(i)
		fieldName := getJSONFieldName(field)
		// Check if the field is a scalar type

		fieldType := getDereferencedType(field.Type)

		switch fieldType.Kind() {
		case reflect.String, reflect.Int, reflect.Float64, reflect.Bool:
			rdfBuilder.WriteString(fmt.Sprintf("uid(n) <%s.%s> * .\n", objType.Name(), fieldName))
		case reflect.Struct:
			if !hasIDField(fieldType) {
				varVar := fmt.Sprintf("v_%s_%s", objType.Name(), fieldName)
				queryBuilder.WriteString(fmt.Sprintf("v_%s_%s as <%s.%s> {", varVar, objType.Name(), fieldName))
				nestedDelete := GenerateNestedDeleteRDF(&queryBuilder, fmt.Sprintf("%s_%s", objType.Name(), fieldName), fieldType)
				queryBuilder.WriteString(" } ")
				rdfBuilder.WriteString(nestedDelete)
			}

		case reflect.Slice:
			// Handle slices of structs recursively
			if elemType, isStruct := getSliceElementType(fieldType); isStruct {
				if !hasIDField(elemType) {
					queryBuilder.WriteString(fmt.Sprintf("v_%s_%s as <%s.%s> {", objType.Name(), fieldName, objType.Name(), fieldName))
					nestedDelete := GenerateNestedDeleteRDF(&queryBuilder, fmt.Sprintf("%s_%s", objType.Name(), fieldName), elemType)
					queryBuilder.WriteString(" } ")
					rdfBuilder.WriteString(nestedDelete)
				}
			}
		case reflect.Pointer:
			console.Log(fmt.Sprintf("Pointer field type: %s", field.Type.Elem()))
		default:
			console.Log(fmt.Sprintf("Unsupported field type: %s", field.Type.Kind()))
		}
	}
	queryBuilder.WriteString(" } }")

	return rdfBuilder.String(), queryBuilder.String(), nil
}

// getDereferencedType returns the underlying type if it's a pointer
func getDereferencedType(t reflect.Type) reflect.Type {
	if t.Kind() == reflect.Ptr {
		return t.Elem()
	}
	return t
}

// getSliceElementType returns the dereferenced element type if it's a slice
func getSliceElementType(t reflect.Type) (reflect.Type, bool) {
	if t.Kind() != reflect.Slice {
		return nil, false
	}
	elem := getDereferencedType(t.Elem())
	return elem, elem.Kind() == reflect.Struct
}

// GenerateNestedDeleteRDF recursively generates deletion RDF for nested objects in a slice.
func GenerateNestedDeleteRDF(queryBuilder *strings.Builder, parentField string, elemType reflect.Type) string {
	var rdfBuilder strings.Builder

	// Recursively delete fields of the struct inside the slice
	for i := 0; i < elemType.NumField(); i++ {
		field := elemType.Field(i)
		fieldName := getJSONFieldName(field)
		fieldType := getDereferencedType(field.Type)
		rdfBuilder.WriteString(fmt.Sprintf("uid(v_%s) <dgraph.type> * .\n", parentField))
		switch fieldType.Kind() {
		case reflect.String, reflect.Int, reflect.Float64, reflect.Bool:
			rdfBuilder.WriteString(fmt.Sprintf("uid(v_%s) <%s.%s> * .\n", parentField, elemType.Name(), fieldName))
		case reflect.Slice:
			// Handle slices of structs recursively
			if elemType, isStruct := getSliceElementType(fieldType); isStruct {
				queryBuilder.WriteString(fmt.Sprintf("v_%s_%s as <%s.%s> {", parentField, fieldName, parentField, fieldName))
				nestedDelete := GenerateNestedDeleteRDF(queryBuilder, fmt.Sprintf("%s_%s", parentField, fieldName), elemType)
				queryBuilder.WriteString(" } ")
				rdfBuilder.WriteString(nestedDelete)
			}
		}
	}
	return rdfBuilder.String()
}

// Save takes a connection string and an object, converts the object to RDF format,
func Save(connection string, obj interface{}) (string, error) {
	rdf, _, err := ToRDF(obj, 0)
	if err != nil {
		return "", err
	}

	// Assuming you have a function to execute the RDF mutation
	response, err := ExecuteMutation(connection, rdf)
	if err != nil {
		return "", err
	}
	return response.Json, nil
}
func GeneratePayload(objType reflect.Type) (string, error) {
	var jsonBuilder strings.Builder
	return generatePayloadRecurse(&jsonBuilder, objType)
}

func generatePayloadRecurse(jsonBuilder *strings.Builder, typ reflect.Type) (string, error) {
	// Convert the object type to JSON
	if typ.Kind() != reflect.Struct {
		return "", fmt.Errorf("expected a struct type, got %s", typ.Name())
	}
	jsonBuilder.WriteString("{")
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		// Get JSON tag if present, otherwise use field name
		fieldName := getJSONFieldName(field)
		switch field.Type.Kind() {
		case reflect.String, reflect.Int, reflect.Float64, reflect.Bool:
			// Handle scalar values directly
			jsonBuilder.WriteString(fmt.Sprintf("%s:%s.%s \n", fieldName, typ.Name(), fieldName))
		case reflect.Struct:
			// Recursively generate JSON for nested struct
			jsonBuilder.WriteString(fmt.Sprintf("%s:%s.%s ", fieldName, typ.Name(), fieldName))
			generatePayloadRecurse(jsonBuilder, field.Type)

		case reflect.Slice:
			// Recursively generate JSON for each object in an array
			if elemType, isStruct := getSliceElementType(field.Type); isStruct {
				// Handle slices of structs
				jsonBuilder.WriteString(fmt.Sprintf("%s:%s.%s ", fieldName, typ.Name(), fieldName))
				_, err := generatePayloadRecurse(jsonBuilder, elemType)
				if err != nil {
					return "", err
				}
			}
		}
	}
	jsonBuilder.WriteString("} ")
	return jsonBuilder.String(), nil
}
func Query[T any](connection string, criteria string) (*[]T, error) {
	// Assuming you have a function to execute the RDF query
	objType := reflect.TypeOf((*T)(nil)).Elem()
	payload, err := GeneratePayload(objType)
	if err != nil {
		return nil, err
	}
	query := fmt.Sprintf("query { node(func: %s) %s }", criteria, payload)

	dgraph_query := dgraph.NewQuery(query)

	response, err := dgraph.ExecuteQuery(connection, dgraph_query, nil)
	if err != nil {
		return nil, err
	}
	str := response.Json[8 : len(response.Json)-1]
	var data []T
	if err := json.Unmarshal([]byte(str), &data); err != nil {
		return nil, err
	}
	return &data, nil
}

func GetByID[T any](connection string, id string) (*T, error) {
	// Assuming you have a function to execute the RDF query
	objType := reflect.TypeOf((*T)(nil)).Elem()
	payload, err := GeneratePayload(objType)
	if err != nil {
		return nil, err
	}

	typeName := objType.Name()
	idField := idField(objType)
	query := fmt.Sprintf("query { node(func: eq(%s.%s, \"%s\")) %s }", typeName, idField, id, payload)

	dgraph_query := dgraph.NewQuery(query)

	response, err := dgraph.ExecuteQuery(connection, dgraph_query, nil)
	if err != nil {
		return nil, err
	}
	str := response.Json[9 : len(response.Json)-2]
	var data T
	if err := json.Unmarshal([]byte(str), &data); err != nil {
		return nil, err
	}
	return &data, nil

}

func Delete(connection string, objId string, objType reflect.Type) (string, error) {
	// Assuming you have a function to execute the RDF mutation
	rdf, query, err := GenerateDeleteRDF(objId, objType)
	if err != nil {
		return "", err
	}
	dgraph_query := dgraph.NewQuery(query)

	mutation := dgraph.NewMutation().WithDelNquads(rdf)

	response, err := dgraph.ExecuteQuery(connection, dgraph_query, mutation)
	if err != nil {
		return "", err
	}
	return response.Json, nil
}

func ExecuteMutation(connection string, rdf string) (*dgraph.Response, error) {
	// Assuming you have a function to connect to Dgraph
	mutation := dgraph.NewMutation().WithSetNquads(rdf)
	response, err := dgraph.ExecuteMutations(connection, mutation)
	if err != nil {
		return nil, err
	}
	return response, nil
}
func getJSONFieldName(field reflect.StructField) string {
	jsonTag := field.Tag.Get("json")
	if jsonTag == "" {
		return field.Name // No JSON tag, use original field name
	}
	if idx := strings.Index(jsonTag, ","); idx != -1 {
		return jsonTag[:idx] // Extract the field name before the first comma
	}
	return jsonTag
}
