import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../App';
import SendIcon from './icons/SendIcon';
import CloseIcon from './icons/CloseIcon';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(input);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-end sm:items-center z-50" onClick={onClose}>
            <div 
                className="bg-slate-800 rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-lg h-[80vh] sm:h-[70vh] flex flex-col transform transition-all duration-300 animate-scale-in" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-blue-300">Asistente AI DiveBot</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>
                            <div className="p-3 rounded-xl bg-slate-700 text-slate-200">
                                <div className="flex items-center justify-center space-x-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregúntale algo a DiveBot..."
                            className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg disabled:bg-slate-600" disabled={isLoading || !input.trim()}>
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
