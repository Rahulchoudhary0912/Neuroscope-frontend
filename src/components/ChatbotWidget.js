import { useState } from 'react';
import { askChatbot } from '../services/api';
import '../styles/chatbot.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleOpen = () => setIsOpen((v) => !v);

  const handleSend = async () => {
    const trimmedQuestion = (question || '').trim();
    if (!trimmedQuestion) {
      alert('Please enter a question.');
      return;
    }

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmedQuestion }
    ]);

    try {
      const res = await askChatbot(trimmedQuestion);
      const text = res.response || 'No response received.';
      setMessages((prev) => [...prev, { role: 'assistant', text }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err.message || 'Something went wrong.' }
      ]);
    } finally {
      setLoading(false);
      setQuestion('');
    }
  };

  return (
    <div className="chatbot-root">
      {/* Floating toggle button */}
      <button
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={toggleOpen}
        aria-label="Toggle Chatbot"
      >
        <i className="fas fa-comments"></i>
      </button>

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <i className="fas fa-robot"></i>
              <span>Medical Assistant</span>
            </div>
            <button className="chatbot-close" onClick={toggleOpen} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-empty">
                Hello 👋 I’m your Medical AI Assistant.<br />
                Ask me about medical or brain-related topics!
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`chatbot-message ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="chatbot-message assistant">Thinking…</div>}
          </div>

          <div className="chatbot-input-row">
            <textarea
              className="chatbot-textarea"
              rows={2}
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button className="chatbot-send" onClick={handleSend} disabled={loading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
