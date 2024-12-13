DGRAPH_VERSION = latest

current_dir = $(shell pwd)

up: ## Start dgraph/standalone container (local development)
	docker run -d --name mydgraph -p "8080:8080" -p "9080:9080"  -v ~/dgraph-101:/dgraph  dgraph/standalone:$(DGRAPH_VERSION)

down: ## Stop the container (local development)
	docker stop  mydgraph

schema-gql: ## Load/update a GraphQL schema (local development)
ifneq (,$(wildcard ./schema/schema.graphql))
	curl --data-binary '@./schema/schema.graphql' --header 'content-type: application/octet-stream' http://localhost:8080/admin/schema
else
	@echo "No schema.graphql found"
endif

drop-data: ## Drops all data (but not the schema, local development)
	curl -X POST localhost:8080/alter -d '{"drop_op": "DATA"}'

drop-all: ## Drops data and schema (local development)
	curl -X POST localhost:8080/alter -d '{"drop_all": true}'

load-data-gql: ## Loads data from a gql-data.json file
ifneq (,$(wildcard ./gql-data.json))
	docker run -it -v $(current_dir):/export dgraph/dgraph:$(DGRAPH_VERSION) dgraph live -a host.docker.internal:9080 -z host.docker.internal:5080 -f /export/gql-data.json
else
	@echo "No gql-data.json file found"
endif

schema-dql: ## Load/update a DQL schema (local development)
ifneq (,$(wildcard ./schema/schema.txt))
	curl --data-binary '@./schema/schema.txt' --header 'content-type: application/dql' http://localhost:8080/alter
else
	@echo "No schema.txt found"
endif


help: ## Print target help
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'