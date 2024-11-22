/**
 * A simple warehouse fake DB with product information.
 */

import { JSON } from "json-as";

class Product {
    qty: u32 = 0;
    price: string = "";
}

/**
 * Get the list of available products.
 */
export function get_product_types(): string {
    const product_list = productInfo.keys();
    
    return `The available products are: ${product_list.join(", ")}`
}   
/**
 * Get the product information for a given product name.
 */
export function get_product_info(string_args: string): string {
    const args = JSON.parse<GetProductArguments>(string_args)
    if (productInfo.has(args.product_name)) {
        const product = productInfo.get(args.product_name)
        const value = args.attribute == "qty" ? product.qty.toString() : product.price
        return `The ${args.attribute} of ${args.product_name} is ${value}. `
    } 
    return `The product ${args.product_name} is not available. `+ get_product_types(); 
}
@json
export class GetProductArguments { 
  product_name: string="";
  attribute: string="";
}

/**
 * Our fake warehouse DB is a map of product name to product information.
 */
const productInfo: Map<string,Product> = new Map<string,Product>();
productInfo.set("Shoe", {qty: 10, price: "100"});
productInfo.set("Hat", {qty: 20, price: "200"});
productInfo.set("Trouser", {qty: 30, price: "300"});
productInfo.set("Shirt", {qty: 40, price: "400"});