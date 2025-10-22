import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-12 mb-6 text-center text-xs text-slate-500">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <p>&copy; {new Date().getFullYear()} Planificador de Buceo AI. Todos los derechos reservados.</p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-slate-300 transition-colors">Política de Privacidad</a>
                    <span aria-hidden="true">|</span>
                    <a href="#" className="hover:text-slate-300 transition-colors">Términos de Uso</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
