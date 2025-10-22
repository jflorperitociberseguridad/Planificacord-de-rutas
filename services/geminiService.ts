import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    // This is a placeholder check. The environment variable is expected to be set.
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

let chat: Chat | null = null;

function initializeChat() {
    if (!ai) return;
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'Eres un asistente experto en buceo llamado "DiveBot". Responde a las preguntas de los usuarios sobre planificación de inmersiones, equipos, seguridad, destinos y vida marina. Sé amigable, conciso y útil. Responde en español.',
        },
    });
}

export const sendChatMessage = async (message: string): Promise<string> => {
    if (!chat) {
        initializeChat();
    }
    try {
        const response = await chat!.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        // Reset chat on error to allow starting a new session
        chat = null; 
        throw new Error("No se pudo obtener una respuesta del asistente. Por favor, inténtelo de nuevo.");
    }
};


export const generateSafetySummary = async (
    objective: string,
    depth: string,
    time: string,
    risks: string[]
): Promise<string> => {
    try {
        const riskText = risks.length > 0 ? `Riesgos adicionales: ${risks.join(', ')}.` : 'Sin riesgos adicionales reportados.';
        
        const systemPrompt = "Eres un Director de Buceo experto y conciso. Tu prioridad es la seguridad.";
        const userQuery = `Genera un resumen de seguridad en 3 puntos clave (máximo 100 palabras) para esta inmersión:
- Objetivo: ${objective}
- Profundidad Máxima: ${depth} metros
- Tiempo de Fondo: ${time} minutos
- ${riskText}
Responde en español. No uses markdown. Formatea la respuesta con saltos de línea.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating safety summary:", error);
        throw new Error("No se pudo generar el resumen de seguridad. Por favor, inténtelo de nuevo.");
    }
};

export const getDestinationInfo = async (
    destination: string, 
    location?: { latitude: number; longitude: number }
): Promise<GenerateContentResponse> => {
    try {
        const systemPrompt = "Eres un guía de buceo experto y entusiasta. Responde en español.";
        const isNearbySearch = /cerca de mí|cercano|cercanos/i.test(destination);
        
        const userQuery = isNearbySearch && location 
            ? `Describe sitios de buceo interesantes cerca de mi ubicación actual. Incluye detalles sobre qué ver, el tipo de buceo y por qué son recomendables.`
            : `Proporciona una descripción concisa (máximo 150 palabras) del destino de buceo: "${destination}". 
Incluye los tipos de buceo más famosos (pecios, arrecifes, etc.) y la fauna marina destacada que se puede encontrar allí.
Basa tu respuesta en información actualizada. No uses markdown. Formatea la respuesta con saltos de línea.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }, { googleMaps: {} }],
                 ...(location && {
                    toolConfig: {
                        retrievalConfig: {
                            latLng: {
                                latitude: location.latitude,
                                longitude: location.longitude,
                            },
                        },
                    },
                }),
            }
        });

        return response;
    } catch (error) {
        console.error("Error getting destination info:", error);
        throw new Error("No se pudo obtener la información del destino. Por favor, inténtelo de nuevo.");
    }
};

export const getBudgetTips = async (destination: string, budget: string): Promise<string> => {
    try {
        const systemPrompt = "Eres un experto en viajes de buceo con un enfoque en presupuestos. Proporciona consejos prácticos y concisos. Responde en español.";
        const userQuery = `Dame 3 consejos clave para ahorrar dinero en un viaje de buceo a "${destination}" con un presupuesto aproximado de ${budget}.
Formatea la respuesta como una lista con viñetas o puntos. No uses markdown.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating budget tips:", error);
        throw new Error("No se pudieron generar los consejos de presupuesto. Por favor, inténtelo de nuevo.");
    }
};

export const generateInspirationImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        if (!prompt.trim()) {
            throw new Error("El prompt no puede estar vacío.");
        }

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
            },
        });

        const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("La API no devolvió una imagen.");
        }
        
        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error generating inspiration image:", error);
        if (error instanceof Error) {
            throw new Error(`No se pudo generar la imagen: ${error.message}`);
        }
        throw new Error("No se pudo generar la imagen. Por favor, inténtelo de nuevo.");
    }
};