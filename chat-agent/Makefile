# usage example
# make ENV=local schema-gql
# make drop-data

# Default environment 'local' - other env 'hypermode'
DOCKER_INSTANCE_NAME ?= dgraph-chat # Set a default Docker instance name or get it from an environment variable


# .env.hypermode file with the following variables
# DGRAPH_CONNECTION_STRING=dgraph://agent-context-havona-tech-ltd.hypermode.host:443?sslmode=verify-ca&bearertoken=<token>

# you can copy paste the connection string from the Hypermode console

# Load the .env file based on the environment
ifneq (,$(wildcard .env))
    echo "Using .env file"
    include .env
    export $(shell sed 's/=.*//' .env)
	DGRAPH_HOST_PORT = $(shell echo '$(DGRAPH_CONNECTION_STRING)' | sed -E 's|^[a-z]+://([^/?]+).*|\1|')
	DGRAPH_ENDPOINT = $(shell if [[ $(DGRAPH_HOST_PORT) == localhost* ]]; then echo "http://$(DGRAPH_HOST_PORT)"; else echo "https://$(DGRAPH_HOST_PORT)/dgraph"; fi)
	DGRAPH_API_TOKEN := $(shell echo '$(DGRAPH_CONNECTION_STRING)' | sed -E 's/.*[?&]bearertoken=([^&]+).*/\1/')
else
    DGRAPH_ENDPOINT = http://localhost:8080
endif



## define DGRAPH_API_TOKEN in env
## define API_TOKEN in env

current_dir = $(shell pwd)

DGRAPH_VERSION = latest

help: ## Print target help
	@echo "Usage: make <target> or make <target> ENV=<environment>"
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m  %-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
backend: 
	cd ./api-go && modus dev &
local: env up schema-dql ## start dgraph, modus API and hypermode-chat frontend (local development)
	cd ./api-go && modus dev & 
	cd ../hypermode-chat && npm install && npm run dev
stop: ## Stop the backend and frontend (local development)
	# Kill the backend process
	kill $(cat .backend.pid) && rm .backend.pid
	# Kill the frontend process
	kill $(cat .frontend.pid) && rm .frontend.pid
ui: ## Start the UI (local development)
	@echo "Starting UI at http://localhost:3000"
	cd ../hypermode-chat && npm install && npm run dev &
up: ## Init and Start dgraph/standalone container (local development)
	@if [ -z "$$(docker ps -q -f name=$(DOCKER_INSTANCE_NAME))" ]; then \
		if [ -z "$$(docker ps -aq -f name=$(DOCKER_INSTANCE_NAME))" ]; then \
			docker run -d --name $(DOCKER_INSTANCE_NAME) -p "8080:8080" -p "9080:9080"  dgraph/standalone:$(DGRAPH_VERSION); \
		else \
			docker start $(DOCKER_INSTANCE_NAME); \
		fi \
	else \
		echo "Container $(DOCKER_INSTANCE_NAME) is already running."; \
	fi
start: ## Start dgraph/standalone container (local development) after you stopped it
	docker start dgraph-rag
down: ## Stop the container (local development)
	docker stop  dgraph-rag
env: ## update the .env file with a user-provided token
	@if [ ! -f ./api-go/.env ]; then \
		read -r -p "Enter model router token: " token; \
		if grep -q "MODUS_HYPERMODE_ROUTER_TOKEN=" ./api-go/.env 2>/dev/null; then \
			sed -i '' "s|MODUS_HYPERMODE_ROUTER_TOKEN=.*|MODUS_HYPERMODE_ROUTER_TOKEN=$$token|" ./api-go/.env; \
		else \
			echo "MODUS_HYPERMODE_ROUTER_TOKEN=$$token" >> ./api-go/.env; \
		fi; \
		echo "Updated ./api-go/.env with MODUS_HYPERMODE_ROUTER_TOKEN"; \
	fi
	
echo: ## Print the current environment
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
