import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import PlannerPage from './components/PlannerPage';
import MapPage from './components/MapPage';
import BudgetPage from './components/BudgetPage';
import { Page } from './types';
import Footer from './components/Footer';
import ChatbotButton from './components/ChatbotButton';
import Chatbot from './components/Chatbot';
import { sendChatMessage } from './services/geminiService';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>(Page.Home);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy DiveBot. ¿En qué puedo ayudarte hoy con tu planificación de buceo?' }
    ]);
    const [isChatLoading, setIsChatLoading] = useState(false);


    const handleNavigate = useCallback((page: Page) => {
        setActivePage(page);
    }, []);

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;

        const newUserMessage: ChatMessage = { role: 'user', text: message };
        setChatMessages(prev => [...prev, newUserMessage]);
        setIsChatLoading(true);

        try {
            const responseText = await sendChatMessage(message);
            const newModelMessage: ChatMessage = { role: 'model', text: responseText };
            setChatMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', text: 'Lo siento, he tenido un problema para conectar. Por favor, inténtalo de nuevo.' };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };


    const renderPage = () => {
        switch (activePage) {
            case Page.Home:
                return <HomePage onNavigate={handleNavigate} />;
            case Page.Planner:
                return <PlannerPage />;
            case Page.Map:
                return <MapPage />;
            case Page.Budget:
                return <BudgetPage />;
            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar activePage={activePage} onNavigate={handleNavigate} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl flex-grow">
                {renderPage()}
            </main>
            <Footer />
            <ChatbotButton onClick={() => setIsChatOpen(true)} />
            <Chatbot 
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
            />
        </div>
    );
};

export default App;