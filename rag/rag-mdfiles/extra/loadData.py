import os
import sys
from urllib.parse import quote
from python_graphql_client import GraphqlClient

# This script reads all files in the Documents folder and subfolders 
# and adds them as RAG data using the GraphQL API exposed by HYpermode app deployed.


# The script requires two environment variables to be set. 
# HYPERMODE_ENDPOINT is found in Hypermode console Home page.
# HYPERMODE_API_TOKEN is found in Hypermode console Settings > API Keys.



if "HYPERMODE_ENDPOINT" in os.environ:
    HYPERMODE_ENDPOINT = os.environ["HYPERMODE_ENDPOINT"]
else:
    HYPERMODE_ENDPOINT = "http://localhost:8686/graphql"
api_token  = ""

if "hypermode.app" in HYPERMODE_ENDPOINT: 
    assert "HYPERMODE_API_TOKEN" in os.environ, "HYPERMODE_API_TOKEN environment variable must be defined. You can find the API Token in the Hypermode console under Settings > API Keys."
    api_token  = "Bearer "+os.environ["HYPERMODE_API_TOKEN"]




headers = { "Authorization": api_token }
gql_client = GraphqlClient(HYPERMODE_ENDPOINT, headers=headers)

def addDocument(id, filename, namespace=""):
    with open(filename) as f:
        markdown_document = f.read()
        query = """
            mutation AddMarkdownPage($id: String!, $content: String!, $namespace: String!) {
                addMarkdownPage(id:$id, mdcontent: $content, namespace: $namespace) {
                    id
                    content
                }
            }
        """
        variables = { "id": id, "content": markdown_document, "namespace": namespace }
        resp = gql_client.execute(query, variables)
        if('errors' in resp):
            sys.exit(f"Error in creating item {resp['errors']}")
        else:
            print(f"Document {id} added successfully in namespace {'default' if namespace == '' else namespace}. {len(resp.get('data').get('addMarkdownPage'))} chunks added.")

path = "Documents"
## Add a single file if a filename is passed as argument
if len(sys.argv) == 2:
    filename = sys.argv[1]
    addDocument(filename, os.path.join(path, filename))
else: ## Add all files in the Documents folder and subfolders
    for file_path, subdirs, files in os.walk(path):
        ## use first sub directory as namespace
        directory = os.path.basename(file_path)
        namespace = "" if directory == path else directory
        for name in files:
            addDocument(name, os.path.join(file_path, name),namespace)
