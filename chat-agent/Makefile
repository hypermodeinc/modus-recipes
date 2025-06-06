# usage example
# make ENV=local schema-gql
# make drop-data

# Default environment 'local' - other env 'hypermode'
ENV ?= local

# .env.hypermode file with the following variables
# DGRAPH_CONNECTION_STRING=dgraph://agent-context-havona-tech-ltd.hypermode.host:443?sslmode=verify-ca&bearertoken=<token>

# you can copy paste the connection string from the Hypermode console

# Load the .env file based on the environment
ifneq (,$(wildcard .env.$(ENV)))
    include .env.$(ENV)
    export $(shell sed 's/=.*//' .env.$(ENV))
else
    $(error Environment file .env.$(ENV) not found!)
endif


DGRAPH_HOST_PORT = $(shell echo '$(DGRAPH_CONNECTION_STRING)' | sed -E 's|^[a-z]+://([^/?]+).*|\1|')
DGRAPH_ENDPOINT = https://$(DGRAPH_HOST_PORT)/dgraph
DGRAPH_API_TOKEN := $(shell echo '$(DGRAPH_CONNECTION_STRING)' | sed -E 's/.*[?&]bearertoken=([^&]+).*/\1/')


## define DGRAPH_API_TOKEN in env
## define API_TOKEN in env

current_dir = $(shell pwd)

DGRAPH_VERSION = latest


up: ## Init and Start dgraph/standalone container (local development)
	docker run -d --name dgraph-rag -p "8080:8080" -p "9080:9080"  -v ~/dgraph-rag:/dgraph  dgraph/standalone:$(DGRAPH_VERSION)
start: ## Start dgraph/standalone container (local development) after you stopped it
	docker start dgraph-rag
down: ## Stop the container (local development)
	docker stop  dgraph-rag
help: ## Print target help
	@echo "Usage: make <target> or make <target> ENV=<environment>"
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m  %-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)


echo: ## Print the current environment
	@echo "Current environment: $(ENV)"
	@echo "DGRAPH_HOST_PORT: $(DGRAPH_HOST_PORT)"
	@echo "DGRAPH_ENDPOINT: $(DGRAPH_ENDPOINT)"


drop-data: ## Drops all data (but not the schema, local development)
	@curl -X POST -H 'Authorization: Bearer $(DGRAPH_API_TOKEN)' $(DGRAPH_ENDPOINT)/alter -d '{"drop_op": "DATA"}'

drop-all: ## Drops data and schema (local development)
	@curl -X POST -H 'Authorization: Bearer $(DGRAPH_API_TOKEN)' $(DGRAPH_ENDPOINT)/alter -d '{"drop_all": true}'


schema-dql: ## Load/update a DQL schema 
ifneq (,$(wildcard ./schema.dql))
	@curl --data-binary '@./schema.dql' -H 'content-type: application/dql' -H 'Authorization: Bearer $(DGRAPH_API_TOKEN)'  $(DGRAPH_ENDPOINT)/alter
else
	@echo "No schema.dql found"
endif
