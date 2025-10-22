import React, { useState, useMemo } from 'react';
import Card from './Card';
import { getBudgetTips } from '../services/geminiService';
import SparkleIcon from './icons/SparkleIcon';

const CostInput: React.FC<{label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;}> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-slate-300">{label}</label>
        <input 
            type="number" 
            value={value}
            onChange={onChange}
            className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-32 text-right p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
    </div>
);

const initialCosts = {
    flights: '0',
    accom: '0',
    diving: '0',
    rental: '0',
    food: '0',
    fees: '0',
    tips: '0',
    other: '0'
};

const currencySymbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    MXN: '$',
};

const BudgetPage: React.FC = () => {
    const [costs, setCosts] = useState(initialCosts);
    const [currency, setCurrency] = useState('EUR');
    const [destination, setDestination] = useState('');
    const [budgetTips, setBudgetTips] = useState('');
    const [isGeneratingTips, setIsGeneratingTips] = useState(false);
    const [tipsError, setTipsError] = useState('');
    
    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof costs) => {
        setCosts(prev => ({ ...prev, [key]: e.target.value }));
    };

    const totalBudget = useMemo(() => {
        return Object.values(costs).reduce((sum, value) => sum + (parseFloat(value as string) || 0), 0);
    }, [costs]);

    const handleGenerateTips = async () => {
        if (!destination.trim()) return;
        setIsGeneratingTips(true);
        setBudgetTips('');
        setTipsError('');

        try {
            const tips = await getBudgetTips(destination, `${currencySymbols[currency]}${totalBudget.toFixed(0)}`);
            setBudgetTips(tips);
        } catch (error) {
            if (error instanceof Error) {
                setTipsError(error.message);
            } else {
                setTipsError('An unknown error occurred.');
            }
        } finally {
            setIsGeneratingTips(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-white">Planificador de Presupuesto</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Calculadora de Costos de Viaje</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-700">
                             <div>
                                <label className="block text-sm font-medium mb-1">Destino</label>
                                <input 
                                    type="text" 
                                    value={destination}
                                    onChange={e => setDestination(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2" 
                                    placeholder="Ej: Egipto (Mar Rojo)" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Moneda</label>
                                <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2">
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="USD">Dólar (USD)</option>
                                    <option value="GBP">Libra (GBP)</option>
                                    <option value="MXN">Peso (MXN)</option>
                                </select>
                            </div>
                        </div>
                         <h3 className="text-xl font-semibold mb-4">Desglose de Gastos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <CostInput label="Vuelos" value={costs.flights} onChange={e => handleCostChange(e, 'flights')} />
                            <CostInput label="Alojamiento" value={costs.accom} onChange={e => handleCostChange(e, 'accom')} />
                            <CostInput label="Paquete de Buceo" value={costs.diving} onChange={e => handleCostChange(e, 'diving')} />
                            <CostInput label="Alquiler de Equipo" value={costs.rental} onChange={e => handleCostChange(e, 'rental')} />
                            <CostInput label="Comida y Bebida" value={costs.food} onChange={e => handleCostChange(e, 'food')} />
                            <CostInput label="Tasas / Nitrox" value={costs.fees} onChange={e => handleCostChange(e, 'fees')} />
                            <CostInput label="Propinas" value={costs.tips} onChange={e => handleCostChange(e, 'tips')} />
                            <CostInput label="Otros" value={costs.other} onChange={e => handleCostChange(e, 'other')} />
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                     <Card className="sticky top-20">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Total del Presupuesto</h2>
                         <div className="text-center">
                            <p className="text-slate-400 text-lg">Costo Total Estimado</p>
                            <p className="text-5xl font-bold text-white">{currencySymbols[currency]}{totalBudget.toFixed(0)}</p>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
                            <SparkleIcon />
                            Consejos de Presupuesto
                        </h2>
                        <button 
                            onClick={handleGenerateTips} 
                            disabled={isGeneratingTips || !destination.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed mb-4 text-sm flex items-center justify-center gap-2"
                        >
                            {isGeneratingTips ? 'Generando...' : 'Obtener Consejos para mi Destino'}
                        </button>
                        {isGeneratingTips && <div className="text-center text-sm text-blue-300">Buscando los mejores consejos...</div>}
                        {budgetTips && <div className="p-3 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">{budgetTips}</div>}
                        {tipsError && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">{tipsError}</div>}
                        {!isGeneratingTips && !budgetTips && !tipsError && <div className="text-center text-xs text-slate-400">Introduce un destino y obtén consejos de ahorro personalizados.</div>}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BudgetPage;