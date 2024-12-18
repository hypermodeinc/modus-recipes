import React, { useState , FormEvent} from "react";
import { graphql } from "../gql";
import { useClient} from "urql";

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
}



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


const ChatApp = () => {
  const client = useClient(); // Get the URQL client instance
  const [messages, setMessages] = useState<Message[]>([{id:1, sender:"bot",text:"How can I help you?"}]); // Chat messages
  const [userInput, setUserInput] = useState(""); // User's input
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) return; // Ignore empty submissions


    setMessages((prev) => [...prev, { id: prev.length+1, sender: "user", text: userInput }]); // Add user message to chat
    setUserInput("");
    setLoading(true);
    try {
      const response = await client.query(ChatQuestion, { question: userInput.trim() }).toPromise();
      console.log(response);
      setMessages((prev) => [...prev, { 
        id: prev.length +1, 
        sender: "bot", 
        text: `${response.data!.generateResponseFromDoc.text || "OK"}` },
        { 
          id: prev.length +2, 
          sender: "bot", 
          text: `From: ${response.data!.generateResponseFromDoc.context?.sources[0].docid}` }]); // Add bot response
    } catch (error) {
      const errorMessage = { sender: "bot", text: "An error occurred. Please try again." };
      setMessages((prev) => [...prev, 
        { id: prev.length +1, sender: "bot", text: "An error occurred. Please try again." }
      ]); // Add error response
    } finally {
      setLoading(false); // Remove loading indicator
    }
  };

  return (
    <div style={{ width: "80%", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ height: "300px", overflowY: "scroll", border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: msg.sender === "user" ? "#daf8e3" : "#f1f1f1",
                color: "#333",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left", color: "#888", fontStyle: "italic" }}>Bot is typing...</div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex" }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flexGrow: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{ marginLeft: "8px", padding: "8px 16px", borderRadius: "4px", border: "none", backgroundColor: "#007bff", color: "#fff", cursor: "pointer" }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatApp;
