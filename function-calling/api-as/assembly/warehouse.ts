import { JSON } from "json-as";
class Product {
    qty: u32 = 0;
    price: string = "";
}

const productInfo: Map<string,Product> = new Map<string,Product>();
productInfo.set("Shoe", {qty: 10, price: "100"});
productInfo.set("Hat", {qty: 20, price: "200"});
productInfo.set("Trouser", {qty: 30, price: "300"});
productInfo.set("Shirt", {qty: 40, price: "400"});

@json
export class GetProductArguments { 
  product_name: string="";
  attribute: string="";
}

export function get_product_info(string_args: string): string {
    const args = JSON.parse<GetProductArguments>(string_args)
    const product = productInfo.get(args.product_name)
    if (!product) {
        return `The product ${args.product_name} is not available.`
    } else {
        const value = args.attribute == "qty" ? product.qty : product.price
    return `The ${args.attribute} of ${args.product_name} is ${value}. `
    }
}