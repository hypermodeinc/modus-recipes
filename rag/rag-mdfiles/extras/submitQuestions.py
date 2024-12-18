import os
import sys
from python_graphql_client import GraphqlClient



 
if "HYPERMODE_ENDPOINT" in os.environ:
    HYPERMODE_ENDPOINT = os.environ["HYPERMODE_ENDPOINT"]
else:
    HYPERMODE_ENDPOINT = "http://localhost:8686/graphql"
api_token  = ""
if "hypermode.app" in HYPERMODE_ENDPOINT: 
    assert "HYPERMODE_API_TOKEN" in os.environ, "HYPERMODE_API_TOKEN environment variable must be defined. You can find the API Token in the Hypermode console under Settings > API Keys."
    api_token  = "Bearer "+os.environ["HYPERMODE_API_TOKEN"]

QUESTIONS = [
    "which planet has rings?",
    "What is the difference between Venus and Saturn?",
]





headers = { "Authorization": api_token }
gql_client = GraphqlClient(HYPERMODE_ENDPOINT, headers=headers)

def askTheDoc(question):
    print (f"\n\n{question}")
    query = """
        query generateResponseFromDoc($q: String!) {
            response:generateResponseFromDoc(question: $q) {
                text
                context {
                    sources { 
                        docid 
                        text
                    }
                }
            }
        }
    """
    variables = { "q": question }
    resp = gql_client.execute(query, variables)
    if('errors' in resp):
        sys.exit(f"Error invoking API: {resp['errors']}")
    else:
       
        print(resp['data']['response']['text'])
        print(f"\nResponse generated from doculemt '{resp['data']['response']['context']['sources'][0]['docid']}'\n")
        print(f"{resp['data']['response']['context']['sources'][0]['text']}\n")

path = "Documents"
## Add all files in the Documents folder and subfolders
for q in QUESTIONS:
    askTheDoc(q)
