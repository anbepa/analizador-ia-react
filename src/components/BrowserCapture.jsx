import React, { useState, useRef, useCallback, useEffect } from 'react';

const BrowserCapture = React.forwardRef(({ onCapture, showTrigger = true }, ref) => {
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

    React.useImperativeHandle(ref, () => ({
        startSession: startCaptureSession
    }));

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
        <div className="mt-4 pt-4 border-t border-secondary-100 w-full max-w-xs mx-auto">
            {showTrigger && (
                <div className="text-center mb-0">
                    <p className="text-xs font-medium text-secondary-400 mb-0.5">Captura de Pantalla</p>
                    <p className="text-[10px] text-secondary-400">Inicia una sesión para capturar un flujo de imágenes</p>
                </div>
            )}

            {!isSessionActive ? (
                showTrigger ? (
                    <div className="flex flex-col items-center">
                        <button
                            onClick={startCaptureSession}
                            className="apple-button-secondary text-primary hover:bg-primary/10 border-primary transition-all duration-[180ms] ease-out"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Iniciar Sesión de Captura
                            </span>
                        </button>
                        <p className="text-xs text-secondary-500 mt-3 text-center max-w-xs">
                            Podrás tomar múltiples capturas de una pestaña o ventana
                        </p>
                    </div>
                ) : null
            ) : (
                <div className="flex flex-col items-center gap-4">
                    {isPreviewVisible ? (
                        <div className="w-full bg-secondary-900 rounded-apple-lg overflow-hidden shadow-apple-md">
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
                        <div className="w-full text-center py-8">
                            <div className="p-4 bg-success/10 rounded-apple border border-success/20">
                                <svg className="w-6 h-6 text-success mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-success font-medium">La sesión de captura está activa</p>
                            </div>
                        </div>
                    )}
                    <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-3">
                        <button
                            onClick={takeSnapshot}
                            disabled={!isVideoReady || isCapturing}
                            className="apple-button-primary bg-success hover:bg-green-600 active:bg-green-700 disabled:bg-secondary-300 disabled:text-secondary-500 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {getButtonText()}
                            </span>
                        </button>
                        <button
                            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                            className="apple-button-secondary"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isPreviewVisible ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                                </svg>
                                {isPreviewVisible ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa'}
                            </span>
                        </button>
                        <button
                            onClick={stopCaptureSession}
                            className="apple-button-secondary text-danger border-danger hover:bg-danger/10"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Finalizar Sesión
                            </span>
                        </button>
                    </div>
                </div>
            )}
            {error && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-apple text-center">
                    <p className="text-danger text-sm font-medium">{error}</p>
                </div>
            )}
        </div>
    );
});

export default BrowserCapture;