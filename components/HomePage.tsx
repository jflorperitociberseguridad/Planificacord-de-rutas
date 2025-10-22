import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import SubscriptionPopup from './SubscriptionPopup';

interface HomePageProps {
    onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    useEffect(() => {
        // Subscription popup logic
        const dismissed = localStorage.getItem('subscriptionPopupDismissed');
        let popupTimer: number | undefined;
        if (!dismissed) {
          popupTimer = window.setTimeout(() => {
            setIsPopupVisible(true);
          }, 5000); // Show after 5 seconds
        }

        // Cleanup function
        return () => {
            if (popupTimer) {
                clearTimeout(popupTimer);
            }
        };
    }, []);

    const handleClosePopup = () => {
        setIsPopupVisible(false);
        localStorage.setItem('subscriptionPopupDismissed', 'true');
    };

    return (
        <>
            <div className="relative bg-slate-800 rounded-xl shadow-2xl overflow-hidden p-8 md:p-16 text-center">
                <div className="absolute inset-0 w-full h-full opacity-50">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="https://videos.pexels.com/video-files/853874/853874-hd_1920_1080_30fps.mp4" type="video/mp4" />
                        Tu navegador no soporta el tag de video.
                    </video>
                </div>
                
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Planifica tu Próxima Aventura Subacuática</h1>
                    <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">Organiza tus rutas, calcula tus costos y descubre nuevos destinos de forma segura y eficiente.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => onNavigate(Page.Planner)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-lg">
                            Comenzar a Planificar
                        </button>
                        <button onClick={() => onNavigate(Page.Map)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 text-lg">
                            Explorar Destinos
                        </button>
                    </div>
                </div>
            </div>
            <SubscriptionPopup isVisible={isPopupVisible} onClose={handleClosePopup} />
        </>
    );
};

export default HomePage;