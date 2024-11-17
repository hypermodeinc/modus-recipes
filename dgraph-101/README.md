# dgraph with modus 101

Demo from 11/16/24 ModusHack Webinar.

## Dgraph

Start a local instance using Docker.

```sh
   docker run --name dgraph-101 -d -p "8080:8080" -p "9080:9080" -v ~/dgraph-101:/dgraph dgraph/standalone:latest
```

Start Ratel, a Graphical data explorer for Dgraph:
```sh
docker run --name ratel  -d -p "8000:8000"  dgraph/ratel:latest
```

## Data model

Modus is code first, simply define you data using classes.
In this example we are using `Product` and `Category` defined in `classes.ts` file.

## Define your API.
