import { useEffect, useState } from "react";
import "./App.css";
import UploadFile from "./components/fileUpload/uploadFile";

function App() {

  const [chatId, setChatId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  const [chats, setChats] = useState([]);
  const [sources, setSources] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("What is my HbA1c level?");
  const [patientId, setPatientId] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((error) => console.error(error));
  }, []);

  const startNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  const sendMessage = async () => {
    if (!patientId || !question.trim()) return;

    const currentQuestion = question;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setQuestion("");

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          question: currentQuestion,
          chatId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setChatId(data.chatId);
      setSources(data.sources);
      loadChats(patientId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);

      console.log("Chat response:", data);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async (selectedPatientId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/patient/${selectedPatientId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load chats");
      }

      console.log("Patient chats:", data);
      setChats(data);
    } catch (error) {
      console.error("Chat history error:", error);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Medical RAG</h2>

        <button onClick={startNewChat}>
          + New Chat
        </button>

        <div className="patient-section">
          <label>Patient</label>

          <select
            value={patientId}
            onChange={(e) => {
              const selectedPatientId = e.target.value;

              setPatientId(selectedPatientId);
              setMessages([]);
              setChatId(null);

              if (selectedPatientId) {
                loadChats(selectedPatientId);
              }
            }}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.name} - {patient.age} - {patient.gender}
              </option>
            ))}
          </select>
        </div>
        <div>
          <UploadFile />
        </div>
        <div className="chat-history">
          <h3>Previous Chats</h3>

          {chats.map((chat) => (
            <button
              key={chat._id}
              title={chat.messages[0]?.content || "New Chat"}
              onClick={() => {
                setChatId(chat._id);
                setMessages(chat.messages);
              }}
            >
              {/* {chat.messages[0]?.content || "New Chat"} */}
              {chat.messages[0]?.content?.slice(0, 35) || "New Chat"}
            </button>
          ))}
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <h1>Medical Assistant</h1>
          <p>Ask questions about the patient's medical records.</p>
        </header>

        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>How can I help?</h2>
              <p>
                Ask a question about the selected patient's medical records.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === "user"
                  ? "user-message"
                  : "assistant-message"
                  }`}
              >
                <div className="message-role">
                  {message.role === "user" ? "You" : "AI Response"}
                </div>

                <div>{message.content}</div>

                {message.role === "assistant" && message.sources?.length > 0 && (
                  <div className="sources">
                    <strong>Sources:</strong>

                    {message.sources.map((source, sourceIndex) => (
                      <button
                        key={sourceIndex}
                        className="source-link"
                        onClick={() => setSelectedSource(source.content)}
                      >
                        View resource {sourceIndex + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Ask about medical records..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </main>

      {selectedSource && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedSource(null)}
        >
          <div
            className="source-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Medical Resource</h3>

            <p>{selectedSource}</p>

            <button onClick={() => setSelectedSource(null)}>
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;