import React, { useState } from 'react';
import Card from './Card';
import { generateSafetySummary } from '../services/geminiService';
import SparkleIcon from './icons/SparkleIcon';

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
);

const FormCheckbox: React.FC<{label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;}> = ({label, checked, onChange}) => (
     <label className="flex items-center"><input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600" /><span className="ml-2">{label}</span></label>
);

const PlannerPage: React.FC = () => {
    // Dive details state
    const [objective, setObjective] = useState('Fotografía de pecio');
    const [maxDepth, setMaxDepth] = useState('30');
    const [bottomTime, setBottomTime] = useState('25');
    
    // Air consumption state
    const [sacRate, setSacRate] = useState('20');
    const [tankSize, setTankSize] = useState('12');
    const [startPressure, setStartPressure] = useState('200');
    const [airResult, setAirResult] = useState<{needed: number; reserve: number; warning: boolean} | null>(null);

    // Safety state
    const [risks, setRisks] = useState({cold: false, tired: false, currents: false});
    const [safetyPlan, setSafetyPlan] = useState('');
    const [safetyError, setSafetyError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCalculateAir = () => {
        const sac = parseFloat(sacRate) || 20;
        const tank = parseFloat(tankSize) || 12;
        const pressure = parseFloat(startPressure) || 200;
        const depth = parseFloat(maxDepth) || 30;
        const time = parseFloat(bottomTime) || 25;

        const totalAir = tank * pressure;
        const ata = (depth / 10) + 1;
        const consumptionAtDepth = sac * ata;
        const airNeeded = consumptionAtDepth * time;
        const reserveAir = totalAir / 3;

        setAirResult({ needed: airNeeded, reserve: reserveAir, warning: airNeeded > (totalAir * (2/3)) });
    };

    const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>, risk: keyof typeof risks) => {
        setRisks(prev => ({ ...prev, [risk]: e.target.checked }));
    };
    
    const handleGenerateSafetyPlan = async () => {
        setIsGenerating(true);
        setSafetyPlan('');
        setSafetyError('');
        
        const selectedRisks = Object.entries(risks)
            .filter(([, value]) => value)
            .map(([key]) => {
                if (key === 'cold') return 'Frío';
                if (key === 'tired') return 'Cansancio';
                if (key === 'currents') return 'Corrientes Fuertes';
                return '';
            });
            
        try {
            const result = await generateSafetySummary(objective, maxDepth, bottomTime, selectedRisks);
            setSafetyPlan(result);
        } catch (error) {
            if (error instanceof Error) {
                setSafetyError(error.message);
            } else {
                setSafetyError('An unknown error occurred.');
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-white">Planificar Inmersión</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300">1. Detalles de la Inmersión</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Objetivo de la Inmersión</label>
                                <FormInput type="text" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ej: Fotografía de pecio, Cueva" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Perfil de Inmersión</label>
                                <FormSelect>
                                    <option>Multinivel ascendente (Correcto)</option>
                                    <option>Ideal (Descenso/Ascenso directo)</option>
                                    <option>Diente de Sierra (¡Peligroso!)</option>
                                </FormSelect>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Profundidad Máxima (metros)</label>
                                <FormInput type="number" value={maxDepth} onChange={e => setMaxDepth(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiempo de Fondo (minutos)</label>
                                <FormInput type="number" value={bottomTime} onChange={e => setBottomTime(e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. Calculadora de Consumo (Estimación)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Consumo en Superficie (SAC l/min)</label>
                                <FormInput type="number" value={sacRate} onChange={e => setSacRate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tamaño Botella (litros)</label>
                                <FormInput type="number" value={tankSize} onChange={e => setTankSize(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Presión Inicial (bares)</label>
                                <FormInput type="number" value={startPressure} onChange={e => setStartPressure(e.target.value)} />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
                             <button onClick={handleCalculateAir} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors w-full md:w-auto">Calcular Consumo</button>
                             {airResult && (
                                <div className={`text-lg font-medium p-3 rounded-lg bg-slate-900 w-full md:w-auto text-center ${airResult.warning ? 'text-red-400' : 'text-green-400'}`}>
                                    <span className="block">Necesario: <strong>{airResult.needed.toFixed(0)} L</strong></span>
                                    <span className="block text-sm">Reserva (1/3): <strong>{airResult.reserve.toFixed(0)} L</strong></span>
                                     {airResult.warning && <span className="block text-xs font-bold">ADVERTENCIA: Consumo excede 2/3.</span>}
                                </div>
                             )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-2xl font-semibold mb-4 text-blue-300">3. Seguridad y Riesgos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <h3 className="text-lg font-medium mb-2">Factores de Riesgo Adicionales</h3>
                                <div className="space-y-1">
                                    <FormCheckbox label="Frío" checked={risks.cold} onChange={e => handleRiskChange(e, 'cold')} />
                                    <FormCheckbox label="Cansancio" checked={risks.tired} onChange={e => handleRiskChange(e, 'tired')} />
                                    <FormCheckbox label="Corrientes Fuertes" checked={risks.currents} onChange={e => handleRiskChange(e, 'currents')} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <button onClick={handleGenerateSafetyPlan} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors w-full disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                <SparkleIcon />
                                <span>{isGenerating ? 'Generando...' : 'Generar Resumen de Seguridad'}</span>
                            </button>
                            {isGenerating && <div className="text-center py-4 text-blue-300">Generando plan de seguridad...</div>}
                            {safetyPlan && <div className="mt-4 p-4 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">{safetyPlan}</div>}
                            {safetyError && <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg">{safetyError}</div>}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                         <h2 className="text-2xl font-semibold mb-4 text-blue-300">Checklist de Equipo</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                             {/* Static checklist content for brevity */}
                             <h3 className="font-semibold mt-2">Navegación y Control</h3>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Ordenador de Buceo</span></label>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Brújula</span></label>
                            
                            <h3 className="font-semibold mt-4">Iluminación y Señalización</h3>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Linterna Principal</span></label>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Boya de Descompresión (SMB)</span></label>
                            
                            <h3 className="font-semibold mt-4">Vestimenta</h3>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Traje (Seco / Húmedo)</span></label>
                            <label className="flex items-center"><input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"/> <span className="ml-2">Máscara (y respaldo)</span></label>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlannerPage;