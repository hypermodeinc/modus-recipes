# Chat Agent with KG

## Launch the API, the frontend and Dgraph

### Run locally

```shell
make local
```

### Run the API locally with an Hypermode Graph instance (hosted)

Update or create `.env` file with

```sh
DGRAPH_CONNECTION_STRING=<Hypermode Graph connection string>
```

The connection string looks like
`dgraph://modus-recipes-backend-hypermode.hypermode.host:443?sslmode=verify-ca&bearertoken=...`

Update api-go/modus.json

```json
"dgraph": {
      "type": "dgraph",
      "connString": "dgraph://<...>.hypermode.host:443?sslmode=verify-ca&bearertoken={{API_KEY}}"
    }
```

and set the MODUS_DGRAPH_API_KEY value in api-go/.env file

## Testing

Open http://localhost:3000/ in your Browser and start a conversation.

Enter some fact like

```txt
I put my passport in the red box under my bed.

I met with Will at the AI Conference yesterday.

Will is working at Hypermode.

...
```

You can see the KG in Dgraph

```txt
{
  fact(func:has(fact)) {
    name:fact
    created_at
    happened_on
    entity:fact.entity { name:entity.name type:entity.type}
  }
}
```

and ask questions in the conversation.

```txt
Where did I put my passport?

What do you know about Will ?

...
```
