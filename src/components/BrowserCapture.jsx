import React, { useState, useRef, useCallback, useEffect } from 'react';

function BrowserCapture({ onCapture }) {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const stopCaptureSession = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsSessionActive(false);
        setIsVideoReady(false);
        setIsPreviewVisible(true);
    }, []);

    const startCaptureSession = async () => {
        setError(null);
        setIsVideoReady(false);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            setError("La API de captura de pantalla no es compatible con este navegador.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 10, max: 15 } },
                audio: false,
            });
            
            streamRef.current = stream;
            setIsSessionActive(true);
            setIsPreviewVisible(true);

            stream.getVideoTracks()[0].onended = () => {
                stopCaptureSession();
            };

        } catch (err) {
            console.error("Error al iniciar la captura: ", err);
            if (err.name === 'NotAllowedError') {
                setError("Permiso denegado para la captura de pantalla.");
            } else {
                setError("No se pudo iniciar la sesión de captura.");
            }
        }
    };

    useEffect(() => {
        if (isSessionActive && isPreviewVisible && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isSessionActive, isPreviewVisible]);

    const takeSnapshot = useCallback(() => {
        if (!videoRef.current) return;

        setIsCapturing(true);
        setError(null);

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `captura-${Date.now()}.png`, { type: 'image/png' });
                onCapture([file]);
            }
            setIsCapturing(false);
        }, 'image/png');
    }, [onCapture]);

    useEffect(() => {
        return () => stopCaptureSession();
    }, [stopCaptureSession]);

    const getButtonText = () => {
        if (!isVideoReady) return 'Cargando vista previa...';
        if (isCapturing) return 'Guardando...';
        return 'Tomar Captura';
    };

    return (
        <div className="my-4 p-4 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-3 font-medium">O inicia una sesión para capturar un flujo de imágenes</p>
            
            {!isSessionActive ? (
                <div className="flex flex-col items-center">
                    <button
                        onClick={startCaptureSession}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        Iniciar Sesión de Captura
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Podrás tomar múltiples capturas de una pestaña o ventana.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    {isPreviewVisible ? (
                        <div className="w-full bg-black rounded-lg overflow-hidden border border-gray-300">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                muted 
                                playsInline
                                onCanPlay={() => setIsVideoReady(true)}
                                className="w-full h-auto"
                            ></video>
                        </div>
                    ) : (
                        <div className="w-full text-center py-4">
                            <p className="text-gray-600">La sesión de captura está activa.</p>
                        </div>
                    )}
                    <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-3">
                        <button
                            onClick={takeSnapshot}
                            disabled={!isVideoReady || isCapturing}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {getButtonText()}
                        </button>
                        <button
                            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            {isPreviewVisible ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa'}
                        </button>
                        <button
                            onClick={stopCaptureSession}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            Finalizar Sesión
                        </button>
                    </div>
                </div>
            )}
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </div>
    );
}

export default BrowserCapture;