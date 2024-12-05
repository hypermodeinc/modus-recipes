import os
import sys
from python_graphql_client import GraphqlClient



 
# HYPERMODE_ENDPOINT is found in Hypermode console Home page.
assert "HYPERMODE_ENDPOINT" in os.environ, "HYPERMODE_ENDPOINT environment variable must be defined. You can find the endpoint in the Hypermode console under Home page."
assert "HYPERMODE_API_TOKEN" in os.environ, "HYPERMODE_API_TOKEN environment variable must be defined. You can find the API Token in the Hypermode console under Settings > API Keys."


QUESTIONS = [
    "What can I do with Hypermode?",
    "In which file should I configure a host?",
    "Provide an example of hypermode.json file"
]

HYPERMODE_ENDPOINT = os.environ["HYPERMODE_ENDPOINT"]
if not HYPERMODE_ENDPOINT.startswith("http"): 
    HYPERMODE_ENDPOINT = "https://"+HYPERMODE_ENDPOINT

api_token  = "Bearer "+os.environ["HYPERMODE_API_TOKEN"]


headers = { "Authorization": api_token }
gql_client = GraphqlClient(HYPERMODE_ENDPOINT, headers=headers)

def askTheDoc(question):
    print (f"\n\n{question}")
    query = """
        query askTheDoc($q: String!) {
            askTheDoc(question: $q) {
                text
                context {
                    chunkId
                    similarity_score
                    text
                }
            }
        }
    """
    variables = { "q": question }
    resp = gql_client.execute(query, variables)
    if('errors' in resp):
        sys.exit(f"Error invoking askTheDoc API: {resp['errors']}")
    else:
        print(f"Response generated from {resp['data']['askTheDoc']['context']['chunkId']}\n")
        print(resp['data']['askTheDoc']['text'])

path = "Documents"
## Add all files in the Documents folder and subfolders
for q in QUESTIONS:
    askTheDoc(q)
