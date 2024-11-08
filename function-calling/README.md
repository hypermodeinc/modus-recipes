# Function Calling With Modus

LLM apis such as OpenAI, have a feature called **function calling** or **tool use**. With this feature the LLM response to a chat message could be a request to invoke a function, usually in order to collect information necessary to generate a response.

This project demonstrates how to setup function calling within Modus when using openAI chat/completion API or any models supporting the same API.


In our case, we are implementing a function `askQuestionToWarehouse` accepting an query in natural language about prices or stock of goods in the warehouse.
The logic is as follow:

Instruct the LLM to use function calls (tools) with the correct parameters to get the data necessary to reply to the provided question.

Execute the identified function calls in Modus to build an additional context.

Re-invoke the LLM API  with the additional context.

Return the generated responses based on the data retrieved by the function calls.

