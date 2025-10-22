import React from 'react';
import ChatIcon from './icons/ChatIcon';

interface ChatbotButtonProps {
    onClick: () => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-300 ease-in-out z-40"
            aria-label="Abrir chat de ayuda"
        >
            <ChatIcon className="w-8 h-8" />
        </button>
    );
};

export default ChatbotButton;