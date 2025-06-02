# Deploying Dgraph schema

Create a `.env.local` file containing the Dgraph connection string

```shell .env.local
DGRAPH_CONNECTION_STRING=dgraph://dgraph-instance-name.hypermode.host:443?sslmode=verify-ca&bearertoken=...

```

Run

```shell
make schema-dql
```
