# Queries to copy/paste in ratel

```json
{
     product(func:type(Product)) {
       id:Product.id
       Product.title
       Product.description
       Product.category { Category.name }
       Product.embedding
     }
}
```

vector search

```json
query search($vector: float32vector) {
        var(func: similar_to(Product.embedding,3,$vector))  {
          vemb as Product.embedding
          dist as math((vemb - $vector) dot (vemb - $vector))
        }
        list(func:uid(dist),orderdesc:val(dist)) {
          score:math(1 - (dist / 2.0))
          Product.id
          Product.description
          Product.title
          Product.category {
            Category.name
          }

        }
    }
```
