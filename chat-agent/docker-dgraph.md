# Dgraph Docker Setup

Simple Docker Compose setup for the Dgraph database used by the chat agent.

## Quick Start

```bash
# Start Dgraph
docker-compose up -d

# Load schema manually
curl --data-binary '@schema.dql' -H 'content-type: application/dql' http://localhost:8080/alter

# Start the Go API (separate terminal)
cd api-go && modus dev
```

## Services

- **Dgraph Alpha**: http://localhost:8080 (HTTP API), localhost:9080 (gRPC)
- **Dgraph Zero**: localhost:5080 (cluster control), localhost:6080 (HTTP)
- **API**: http://localhost:8686/graphql (via `modus dev`)

## Commands

```bash
# Start/stop
docker-compose up -d
docker-compose down

# Fresh start (clears data)
docker-compose down
rm -rf ~/chat-dgraph
docker-compose up -d

# View logs
docker-compose logs -f alpha
docker-compose logs -f zero

# Load schema
curl --data-binary '@schema.dql' -H 'content-type: application/dql' http://localhost:8080/alter

# Check status
docker-compose ps
```

## Data Location

Data is stored in `~/chat-dgraph` on your host machine for persistence.

## Requirements

- Docker & Docker Compose
- `api-go/.env` with `MODUS_HYPERMODE_ROUTER_TOKEN=your_token`
