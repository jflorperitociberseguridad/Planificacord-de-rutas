

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from './Card';
import { getDestinationInfo, generateInspirationImage } from '../services/geminiService';
import SparkleIcon from './icons/SparkleIcon';
import type { GroundingChunk } from '@google/genai';

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
);

const InspirationCard: React.FC<{ imgSrc: string; title: string }> = ({ imgSrc, title }) => (
    <div className="relative rounded-lg overflow-hidden group h-48">
        <img src={imgSrc} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
            <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>
    </div>
);

const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
);

const Canvas = ({ canvasRef, isModal = false }: { canvasRef: React.RefObject<HTMLCanvasElement>, isModal?: boolean }) => {
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;
        
        context.lineCap = "round";
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 3;
        contextRef.current = context;
    }, [canvasRef]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = nativeEvent;
        if (contextRef.current) {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        }
    };

    const finishDrawing = () => {
        if (contextRef.current) {
            contextRef.current.closePath();
            setIsDrawing(false);
        }
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !contextRef.current) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            className={`cursor-crosshair w-full h-full ${isModal ? '' : 'rounded-lg'}`}
        />
    );
};


const MapPage: React.FC = () => {
    const [destination, setDestination] = useState('');
    const [info, setInfo] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [imagePrompt, setImagePrompt] = useState('Un pulpo fotorrealista explorando un galeón hundido');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageError, setImageError] = useState('');

    // Canvas refs
    const smallCanvasRef = useRef<HTMLCanvasElement>(null);
    const modalCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleClearSketch = useCallback(() => {
        [smallCanvasRef, modalCanvasRef].forEach(ref => {
            const canvas = ref.current;
            const context = canvas?.getContext('2d');
            if (canvas && context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    }, []);
    
    const handleSaveSketch = useCallback(() => {
        const canvas = isCanvasExpanded ? modalCanvasRef.current : smallCanvasRef.current;
        if (canvas) {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = 'dive-sketch.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [isCanvasExpanded]);
    
    const syncCanvas = useCallback((sourceRef: React.RefObject<HTMLCanvasElement>, destRef: React.RefObject<HTMLCanvasElement>) => {
        const sourceCanvas = sourceRef.current;
        const destCanvas = destRef.current;
        if (sourceCanvas && destCanvas) {
            const destCtx = destCanvas.getContext('2d');
            if (destCtx) {
                destCanvas.width = sourceCanvas.width;
                destCanvas.height = sourceCanvas.height;
                destCtx.drawImage(sourceCanvas, 0, 0);
            }
        }
    }, []);

    const handleOpenModal = () => {
        setIsCanvasExpanded(true);
        // Defer sync to allow modal canvas to render
        setTimeout(() => syncCanvas(smallCanvasRef, modalCanvasRef), 0);
    };

    const handleCloseModal = () => {
        syncCanvas(modalCanvasRef, smallCanvasRef);
        setIsCanvasExpanded(false);
    };

    const handleGetInfo = async () => {
        if (!destination.trim()) {
            setError('Por favor, introduce un destino para buscar.');
            return;
        }
        setIsLoading(true);
        setInfo('');
        setSources([]);
        setError('');

        try {
            const response = await getDestinationInfo(destination, userLocation ?? undefined);
            setInfo(response.text);
            const metadata = response.candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                setSources(metadata.groundingChunks);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        setGeneratedImage(null);
        setImageError('');
        try {
            const imageUrl = await generateInspirationImage(imagePrompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (err) {
            if (err instanceof Error) {
                setImageError(err.message);
            } else {
                setImageError('An unknown error occurred while generating the image.');
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleClearImage = () => {
        setGeneratedImage(null);
        setImageError('');
    };

    // Set initial canvas size and get user location
    useEffect(() => {
        const canvas = smallCanvasRef.current;
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting geolocation:", error);
                    setLocationError('No se pudo obtener tu ubicación. Las búsquedas cercanas no estarán disponibles.');
                }
            );
        }
    }, []);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-white">Mapas, Esquemas e Ideas</h1>
            
            <Card>
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Planificador de Croquis de Inmersión</h2>
                 {locationError && <p className="text-xs text-amber-400 mb-2">{locationError}</p>}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <FormInput 
                        type="text" 
                        value={destination} 
                        onChange={e => setDestination(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGetInfo()}
                        placeholder={userLocation ? "Busca un destino o escribe 'cerca de mí'" : "Buscar destino (Ej: Mar Rojo, Galápagos...)"}
                    />
                    <button onClick={handleGetInfo} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <SparkleIcon />
                        <span>{isLoading ? 'Buscando...' : 'Obtener Info'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-slate-300">Información del Destino</h3>
                        {isLoading && <div className="text-center py-4 text-blue-300">Buscando información...</div>}
                        {info && <div className="mb-4 p-4 bg-slate-900 rounded-lg text-sm whitespace-pre-wrap">{info}</div>}
                        {sources.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm text-slate-400 mb-2">Fuentes:</h4>
                                <ul className="space-y-1">
                                    {sources.map((chunk, index) => {
                                        if (chunk.web) {
                                            return (
                                                <li key={`web-${index}`} className="truncate">
                                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                                                        <span className="font-bold">[Web]</span> {chunk.web.title || chunk.web.uri}
                                                    </a>
                                                </li>
                                            );
                                        }
                                        if (chunk.maps) {
                                            return (
                                                <li key={`map-${index}`} className="truncate">
                                                    <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline">
                                                         <span className="font-bold">[Mapa]</span> {chunk.maps.title}
                                                    </a>
                                                </li>
                                            );
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        )}
                        {error && <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
                        {!isLoading && !info && !error && <div className="text-slate-400 text-sm">Busca un destino para ver la información aquí.</div>}
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-300">Mi Croquis</h3>
                        <div className="relative h-80 rounded-lg bg-slate-900/50 border-2 border-dashed border-slate-600 overflow-hidden">
                             <Canvas canvasRef={smallCanvasRef} />
                             <button onClick={handleOpenModal} className="absolute top-2 right-2 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-white transition-colors">
                                <ExpandIcon className="w-5 h-5" />
                             </button>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={handleSaveSketch} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                Guardar Croquis
                            </button>
                            <button onClick={handleClearSketch} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Generador de Imágenes AI</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tu idea (en inglés para mejores resultados)</label>
                            <textarea 
                                value={imagePrompt}
                                onChange={e => setImagePrompt(e.target.value)}
                                placeholder="Ej: A photorealistic octopus exploring a sunken galleon"
                                className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg w-full p-2.5 h-24 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Relación de Aspecto</label>
                            <div className="flex flex-wrap gap-2">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                    <button 
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleGenerateImage} 
                                disabled={isGeneratingImage} 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <SparkleIcon />
                                <span>{isGeneratingImage ? 'Generando...' : 'Generar Imagen'}</span>
                            </button>
                            {(generatedImage || imageError) && (
                               <button onClick={handleClearImage} className="flex-shrink-0 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors">
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-center bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-600 min-h-[250px] p-4">
                        {isGeneratingImage && (
                            <div className="text-center text-blue-300">
                                <svg className="animate-spin h-8 w-8 text-white mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creando tu visión...
                            </div>
                        )}
                        {imageError && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">{imageError}</div>}
                        {generatedImage && !isGeneratingImage && (
                            <img src={generatedImage} alt="Imagen generada por IA" className="max-w-full max-h-full object-contain rounded-md" />
                        )}
                        {!isGeneratingImage && !generatedImage && !imageError && (
                            <div className="text-center text-slate-400">
                                <p>Tu imagen aparecerá aquí.</p>
                                <p className="text-xs">La generación puede tardar unos segundos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Galería de Inspiración</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InspirationCard imgSrc="https://images.unsplash.com/photo-1504439252945-212a0a2043c5?q=80&w=600&h=400&fit=crop" title="Gigantes del Océano" />
                    <InspirationCard imgSrc="https://images.unsplash.com/photo-1552083375-1447ce886485?q=80&w=600&h=400&fit=crop" title="Arrecifes de Coral" />
                    <InspirationCard imgSrc="https://images.unsplash.com/photo-1581452934096-7889a24f0c40?q=80&w=600&h=400&fit=crop" title="Fotografía Macro" />
                    <InspirationCard imgSrc="https://images.unsplash.com/photo-1616422285434-d021f1a5a04e?q=80&w=600&h=400&fit=crop" title="Criaturas Nocturnas" />
                </div>
            </Card>

            {/* Canvas Modal */}
            {isCanvasExpanded && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col p-4">
                    <div className="flex-grow rounded-lg overflow-hidden border border-slate-700">
                         <Canvas canvasRef={modalCanvasRef} isModal />
                    </div>
                    <div className="flex-shrink-0 pt-4 flex justify-center items-center gap-4">
                        <button onClick={handleSaveSketch} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-5 rounded-lg transition-colors">Guardar</button>
                        <button onClick={handleClearSketch} className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-5 rounded-lg transition-colors">Limpiar</button>
                        <button onClick={handleCloseModal} className="bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-5 rounded-lg transition-colors">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;