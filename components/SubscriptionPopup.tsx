import React, { useState, useEffect } from 'react';

interface SubscriptionPopupProps {
    isVisible: boolean;
    onClose: () => void;
}

const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({ isVisible, onClose }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Subscribed with email:', email);
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, onClose]);


    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform transition-all duration-300 animate-scale-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-blue-300 mb-2">¡No te pierdas ninguna aventura!</h2>
                <p className="text-slate-300 mb-6">Suscríbete y recibe las mejores rutas, consejos y ofertas exclusivas en tu correo.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        required
                        className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-lg w-full">
                        Suscribirme
                    </button>
                </form>
                 <button onClick={onClose} className="text-slate-400 hover:text-white mt-4 text-sm transition-colors">
                    No, gracias
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPopup;
