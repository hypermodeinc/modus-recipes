import { graphql } from "./gql";

export const ChatQuestion = graphql(`
    query GenerateResponseFromDoc($question: String!) {
      generateResponseFromDoc(
          question: $question
      ) {
          text
          context {
              sources { docid text}
          }
      }
      }
  `)