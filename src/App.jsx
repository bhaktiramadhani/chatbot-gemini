import { useState } from "react";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { marked } from "marked";

function App() {
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false); // State untuk menampilkan animasi mengetik
  const [typingChatIndex, setTypingChatIndex] = useState(null); // Index chat yang sedang mengetik
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

  const simulateTyping = (text, index) => {
    let typingText = "";
    let i = 0;

    const interval = setInterval(() => {
      typingText += text[i];
      setChats((prevChats) =>
        prevChats.map((chat, chatIndex) =>
          chatIndex === index + 1 ? { ...chat, text: typingText } : chat
        )
      );
      i += 1;
      if (i >= text.length) {
        clearInterval(interval);
        setTypingChatIndex(null); // Stop loading animation
      }
    }, 5); // Adjust the typing speed here
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Add user's message to chat history
    const userMessage = { text: text, time: Date.now(), user: "You" };
    setChats((prevChats) => [...prevChats, userMessage]);
    setText("");

    // Prepare chat history for sending to the model
    const chatHistory = chats.map((chat) => ({
      role: chat.user === "You" ? "user" : "model",
      parts: [{ text: chat.text }],
    }));

    // Add the new user message to the chat history
    chatHistory.push({
      role: "user",
      parts: [{ text: text }],
    });

    // Set loading to true to show typing animation
    setLoading(true);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(text);
    const response = await result.response;
    let aiResponseText = await response.text();

    // Format the response text using marked
    aiResponseText = marked(aiResponseText);

    // Add a placeholder message for the AI typing indicator
    const aiMessagePlaceholder = {
      text: "",
      time: Date.now(),
      user: "AI",
    };
    setChats((prevChats) => [...prevChats, aiMessagePlaceholder]);
    setTypingChatIndex(chats.length); // Set the index of the typing chat

    // Simulate typing animation
    simulateTyping(aiResponseText, chats.length);

    // Update the chat history with the full AI response once typing simulation is done
    setTimeout(() => {
      setChats((prevChats) =>
        prevChats.map((chat, chatIndex) =>
          chatIndex === typingChatIndex
            ? { ...chat, text: aiResponseText }
            : chat
        )
      );
    }, (aiResponseText.length + 1) * 50); // Ensure timing matches the typing simulation
  };

  return (
    <div className="w-full min-h-screen h-auto flex justify-center">
      <div className="card rounded-none md:rounded-2xl bg-white text-black md:m-8 w-[800px] shadow-xl">
        <div className="card-body px-4 flex flex-col">
          <h1 className="font-bold text-2xl text-center">
            Chat with Gemini AI
          </h1>
          <div className="grow mb-4">
            {chats.map((chat, index) => (
              <div
                key={index}
                className={`chat ${
                  chat.user === "AI" ? "chat-start" : "chat-end"
                }`}
              >
                <div className="chat-header">
                  {chat.user}{" "}
                  <time className="text-xs opacity-50">
                    {new Date(chat.time).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div
                  className={`chat-bubble ${
                    chat.user === "AI" && "overflow-x-auto"
                  }`}
                  dangerouslySetInnerHTML={{ __html: chat.text }}
                ></div>
              </div>
            ))}
            {/* Tampilkan animasi mengetik saat loading */}
            {loading && typingChatIndex === chats.length - 1 && (
              <div className="chat chat-start">
                <div className="chat-header">AI</div>
                <div className="chat-bubble">
                  <div className="typing-indicator">{`...${aiTyping}`}</div>
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={handleSend}
            className={`${
              text !== "" && "join"
            } self-center w-full mt-4 rounded-lg`}
          >
            <input
              className="input input-bordered join-item w-full bg-white border-black"
              placeholder="Mau nanya apa?"
              value={text}
              required
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="submit"
              className={`btn join-item rounded-lg ${text === "" && "hidden"}`}
            >
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
