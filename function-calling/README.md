# Function Calling With Modus

## Get started

1- Set your credentials

Create the file `.env.dev.local` in `api-as` folder, containing your OpenAI API key:
```
MODUS_OPENAI_API_KEY="sk-...."
```

2- launch the API

From `api-as` folder launch
```
modus dev
```

3- Test the GraphQL operation
From a GraphQL client (Postman),
Introspect the GraphQL endpoint `http://localhost:8686/graphql`
Invoke the operation  `askQuestionToWarehouse`
Experiment with some queries to see the function tools at work.

The operation replies with an array of strings showing the steps used to produce a response along with the final response.

```text
# example of questions
What can you do for me?
what fo we have in the warehouse?
How many shoes  in stock?
How many shoes and hats do we have in stock?
What is the most expensive product in stock?
what is the price of a desks?

```



## About

LLM apis such as OpenAI, have a feature called **function calling** or **tool use**. With this feature the LLM response to a chat message could be a request to invoke a function, usually in order to collect information necessary to generate a response.

This project demonstrates how to setup function calling within Modus when using openAI chat/completion API or any models supporting the same API.


In our case, we are implementing a function `askQuestionToWarehouse` accepting an query in natural language about prices or stock of goods in the warehouse.

We are declaring 2 tools available for the LLM
- getProductList: provide the list of product types we have in the warehouse
- 

The logic is as follow:

- Instruct the LLM to use function calls (tools) with the correct parameters to get the data necessary to reply to the provided question.

- Execute the identified function calls in Modus to build an additional context.

- Re-invoke the LLM API  with the additional context.

Return the generated responses based on the data retrieved by the function calls.

## Discussion
Correct prompt helps to address questions that are out of scope.

Descriptions of function and parameters are also part of the prompt engineering!

Enums parameter can help. Try replacing the `product_name` parameter by an Enum type and see that the LLM can skip a function call.

Need a way to avoid loops. That's why we have a limit to 3 calls.

Need to experiment more to understand what are good functions in terms of abstraction, number of parameters etc ...
