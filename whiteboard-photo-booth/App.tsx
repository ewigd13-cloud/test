
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { WhiteboardGridInput } from './components/ChalkboardInput';
import { CameraIcon, DownloadIcon, RetakeIcon, SwitchCameraIcon, TimerIcon } from './components/Icons';

const NUM_ROWS = 5;
const NUM_COLS = 2;

// Helper function to find the best font size and wrap text to fit in a box
const getAdjustedFontAndLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number
): { lines: string[]; lineHeight: number } => {
    if (!text || text.trim() === '') return { lines: [], lineHeight: 0 };

    const minFontSize = 8;
    let initialFontSize = Math.floor(maxHeight / 1.4);

    for (let fontSize = initialFontSize; fontSize >= minFontSize; fontSize--) {
        ctx.font = `700 ${fontSize}px 'Noto Serif JP', serif`;
        if (ctx.measureText(text).width <= maxWidth) {
            return { lines: [text], lineHeight: fontSize * 1.4 };
        }
    }

    initialFontSize = Math.max(16, Math.floor(maxWidth / 4));

    for (let fontSize = initialFontSize; fontSize >= minFontSize; fontSize--) {
        ctx.font = `700 ${fontSize}px 'Noto Serif JP', serif`;
        const lineHeight = fontSize * 1.4;
        const lines: string[] = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        if (lines.length * lineHeight <= maxHeight) {
            return { lines, lineHeight };
        }
    }

    ctx.font = `700 ${minFontSize}px 'Noto Serif JP', serif`;
    const lineHeight = minFontSize * 1.4;
    const lines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return { lines, lineHeight };
};

// Helper function to draw the whiteboard onto a given context
const drawWhiteboard = (context: CanvasRenderingContext2D, boardWidth: number, boardHeight: number, texts: string[]) => {
    const borderPadding = 8;
    const textPadding = 5;

    const gridWidth = boardWidth - borderPadding * 2;
    const gridHeight = boardHeight - borderPadding * 2;
    
    const colWidths = [gridWidth * 0.3, gridWidth * 0.7];
    const cellHeight = gridHeight / NUM_ROWS;
    const effectiveCellHeight = cellHeight - textPadding * 2;

    const textsToDraw = [...texts];
    if (textsToDraw[7] && /^\d{4}-\d{2}-\d{2}$/.test(textsToDraw[7])) {
        const [year, month, day] = textsToDraw[7].split('-');
        textsToDraw[7] = `${year}年${month}月${day}日`;
    }
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    context.strokeStyle = '#1a1a1a';
    context.lineWidth = 2;
    context.strokeRect(0, 0, boardWidth, boardHeight);
    context.strokeRect(
        borderPadding,
        borderPadding,
        gridWidth,
        gridHeight
    );

    context.strokeStyle = '#cccccc';
    context.lineWidth = 1;
    context.beginPath();
    
    for (let i = 1; i < NUM_ROWS; i++) {
        const y = borderPadding + (i * cellHeight);
        context.moveTo(borderPadding, y);
        context.lineTo(boardWidth - borderPadding, y);
    }
    
    const verticalLineX = borderPadding + colWidths[0];
    context.moveTo(verticalLineX, borderPadding);
    context.lineTo(verticalLineX, borderPadding + gridHeight);
    context.stroke();

    context.fillStyle = '#1a1a1a';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            const index = row * NUM_COLS + col;
            const text = textsToDraw[index];

            const currentCellWidth = colWidths[col];
            const effectiveCellWidth = currentCellWidth - textPadding * 2;
            
            const { lines, lineHeight } = getAdjustedFontAndLines(
                context,
                text,
                effectiveCellWidth,
                effectiveCellHeight
            );
            
            if (lines.length > 0) {
                const cellLeftX = borderPadding + (col === 0 ? 0 : colWidths[0]);
                const cellTopY = borderPadding + row * cellHeight;
                
                const textBlockHeight = lines.length * lineHeight;
                const textStartX = cellLeftX + currentCellWidth / 2;
                let textStartY = cellTopY + (cellHeight / 2) - (textBlockHeight / 2) + (lineHeight / 2);

                lines.forEach(line => {
                    context.fillText(line, textStartX, textStartY);
                    textStartY += lineHeight;
                });
            }
        }
    }
};


const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [whiteboardTexts, setWhiteboardTexts] = useState<string[]>(() => {
    const texts = Array(NUM_ROWS * NUM_COLS).fill('');
    texts[0] = '設備';
    texts[2] = '対象';
    texts[4] = '種類';
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    texts[6] = '日付';
    texts[7] = `${year}-${month}-${day}`;
    return texts;
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // FIX: Use ReturnType<typeof setTimeout> for the timer ref to ensure correct typing in browser environments.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const switchCamera = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas && !imageSrc) {
      const context = canvas.getContext('2d');
      if (context) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        context.scale(dpr, dpr);
        context.clearRect(0, 0, rect.width, rect.height);
        drawWhiteboard(context, rect.width, rect.height, whiteboardTexts);
      }
    }
  }, [whiteboardTexts, imageSrc]);

  const performCapture = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        context.setTransform(1, 0, 0, 1, 0, 0);

        const boardWidth = canvas.width / 2;
        const boardHeight = canvas.height / 3;
        const boardLeftX = 0;
        const boardTopY = canvas.height - boardHeight;

        context.save();
        context.translate(boardLeftX, boardTopY);
        drawWhiteboard(context, boardWidth, boardHeight, whiteboardTexts);
        context.restore();
        
        setImageSrc(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [videoRef, whiteboardTexts, facingMode]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      performCapture();
      setCountdown(null);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown, performCapture]);

  const capturePhoto = useCallback(() => {
    if (isTimerEnabled) {
      setCountdown(10);
    } else {
      performCapture();
    }
  }, [isTimerEnabled, performCapture]);

  const cancelCountdown = () => {
    setCountdown(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const retakePhoto = () => {
    setImageSrc(null);
  };

  const downloadPhoto = () => {
    if (imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = 'whiteboard-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center justify-center p-4">
        <header className="text-center mb-4">
            <h1 className="text-4xl font-marker text-white">Whiteboard Photo Booth</h1>
            <p className="text-gray-400">Capture a moment and sign your message!</p>
        </header>
        <main className="w-full max-w-3xl aspect-[4.3/5.7] bg-black rounded-lg shadow-2xl overflow-hidden relative">
            {imageSrc ? (
                <img src={imageSrc} alt="Your photo booth capture" className="w-full h-full object-contain" />
            ) : (
                <>
                    <CameraView videoRef={videoRef} facingMode={facingMode} />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute bottom-0 left-0 w-1/2 h-1/3 opacity-80 pointer-events-none"
                      aria-hidden="true"
                    />
                    {countdown !== null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                        {countdown > 0 ? (
                            <span className="text-white text-9xl font-bold drop-shadow-lg animate-ping-once" key={countdown}>
                                {countdown}
                            </span>
                        ) : (
                            <div className="absolute inset-0 bg-white opacity-80 animate-flash"></div>
                        )}
                      </div>
                    )}
                </>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </main>

        <footer className="mt-6 w-full max-w-3xl">
            {imageSrc ? (
                <div className="flex justify-center items-center gap-4">
                    <button onClick={retakePhoto} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                        <RetakeIcon /> Retake
                    </button>
                    <button onClick={downloadPhoto} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                        <DownloadIcon /> Download
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <WhiteboardGridInput texts={whiteboardTexts} setTexts={setWhiteboardTexts} disabled={countdown !== null} />
                    <div className="flex justify-center items-center relative h-20">
                        {countdown !== null ? (
                            <button onClick={cancelCountdown} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg text-lg">
                                タイマーをキャンセル
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsTimerEnabled(!isTimerEnabled)} title="セルフタイマー" className={`absolute left-0 bg-gray-600 hover:bg-gray-700 text-white font-bold p-4 rounded-full transition-all transform hover:scale-105 shadow-lg ${isTimerEnabled ? 'bg-blue-600 ring-2 ring-white' : ''}`} aria-label="セルフタイマーを切り替え">
                                    <TimerIcon />
                                </button>
                                <button onClick={capturePhoto} className="bg-red-600 hover:bg-red-700 text-white font-bold p-5 rounded-full transition-transform transform hover:scale-105 shadow-lg ring-4 ring-white ring-opacity-25 focus:outline-none focus:ring-opacity-50" aria-label="撮影">
                                    <CameraIcon />
                                </button>
                                <button onClick={switchCamera} title="カメラ切替" className="absolute right-0 bg-gray-600 hover:bg-gray-700 text-white font-bold p-4 rounded-full transition-transform transform hover:scale-105 shadow-lg" aria-label="カメラ切替">
                                    <SwitchCameraIcon />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </footer>
    </div>
  );
};

export default App;
