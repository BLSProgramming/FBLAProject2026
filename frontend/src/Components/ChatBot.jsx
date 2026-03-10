import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IoChatbubbleEllipsesOutline, IoClose, IoSend } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../utils/constants';

// Lightweight markdown renderer for chat messages
function renderMarkdown(text, navigate) {
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={key++} className="list-disc list-inside space-y-1 my-1">{listItems}</ul>);
      listItems = [];
    }
  };

  const formatInline = (str) => {
    const parts = [];
    let remaining = str;
    let k = 0;
    // Process bold and links
    while (remaining.length > 0) {
      // Match link [text](url) or bold **text**
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

      // Find whichever comes first
      const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;
      const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;

      if (linkIdx === Infinity && boldIdx === Infinity) {
        parts.push(<span key={k++}>{remaining}</span>);
        break;
      }

      if (linkIdx <= boldIdx) {
        if (linkIdx > 0) parts.push(<span key={k++}>{remaining.slice(0, linkIdx)}</span>);
        const href = linkMatch[2];
        // Use client-side navigation for internal links
        if (href.startsWith('/')) {
          parts.push(
            <a key={k++} href={href} onClick={(e) => { e.preventDefault(); navigate(href); }} className="text-yellow-400 underline hover:text-yellow-300 cursor-pointer">
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(
            <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300">
              {linkMatch[1]}
            </a>
          );
        }
        remaining = remaining.slice(linkIdx + linkMatch[0].length);
      } else {
        if (boldIdx > 0) parts.push(<span key={k++}>{remaining.slice(0, boldIdx)}</span>);
        parts.push(<strong key={k++} className="font-semibold text-yellow-300">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldIdx + boldMatch[0].length);
      }
    }
    return parts;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet point
    if (/^[-*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(<li key={key++}>{formatInline(content)}</li>);
      continue;
    }

    flushList();

    if (trimmed === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++}>{formatInline(trimmed)}</p>);
    }
  }
  flushList();
  return elements;
}

export default function ChatBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m the Biz-Buzz Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send only role/content pairs (exclude the initial greeting if it's local-only)
      const apiMessages = updatedMessages
        .filter((_, i) => i > 0 || updatedMessages[0].role === 'user')
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch(`${API_BASE_URL}/api/Chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process your request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-gray-900 border border-yellow-400/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
             style={{ height: '28rem' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-yellow-400 text-black">
            <span className="font-bold text-sm">Biz-Buzz Assistant</span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-yellow-500 rounded-full p-1 transition-colors cursor-pointer">
              <IoClose size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" aria-live="polite" aria-relevant="additions">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-yellow-400 text-black rounded-br-sm whitespace-pre-wrap'
                    : 'bg-gray-800 text-gray-200 rounded-bl-sm space-y-1'
                }`}>
                  {msg.role === 'user' ? msg.content : renderMarkdown(msg.content, navigate)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 px-3 py-2 rounded-xl rounded-bl-sm text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-700/50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                maxLength={2000}
                className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400/50 placeholder-gray-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <IoSend size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="ml-auto flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-300 transition-colors cursor-pointer"
      >
        {isOpen ? <IoClose size={24} /> : <IoChatbubbleEllipsesOutline size={24} />}
      </button>
    </div>
  );
}
