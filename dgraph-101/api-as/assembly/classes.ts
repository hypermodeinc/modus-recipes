/* 
    This file contains the classes that are used in our App.
    The classes are annotated with the @json decorator 
    to be serialized and deserialized as json string.
    @alias is used to rename the properties in the json string to match Dgraph best practices.
*/

@json
export class Product {

  @alias("Product.id")
  id!: string


  @alias("Product.title")
  title: string = ""


  @alias("Product.description")
  description: string = ""


  @alias("Product.category")
  @omitnull()
  category: Category | null = null
}


@json
export class Category {

  @alias("Category.name")
  name: string = ""
}
