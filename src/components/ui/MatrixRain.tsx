import React, { useRef, useEffect, useCallback } from 'react';

interface MatrixRainProps {
  className?: string;
  speed?: number;
  opacity?: number;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ 
  className = '', 
  speed = 0.3,
  opacity = 0.8 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const dropsRef = useRef<number[]>([]);
  const dropSpeedsRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const easterEggRef = useRef<{
    current: string | null;
    progress: number;
    column: number;
  }>({
    current: null,
    progress: 0,
    column: -1,
  });

  // Character sets
  const baseCharacters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  const easterEggWords = [
    "ARK", "FORENSIC", "ANALYSIS", "MATRIX",
    "DECRYPT", "STEGO", "CIPHER", "DATA",
    "INVESTIGATION", "DIGITAL", "TRACE", "EVIDENCE"
  ];

  const fontSize = 14;
  const baseSpeed = speed;
  const maxSpeed = speed * 2;
  const easterEggFrequency = 200;

  const selectCharacter = useCallback((columnIndex: number): string => {
    frameCountRef.current++;
    
    // Check if we should start a new easter egg
    if (easterEggRef.current.current === null && Math.random() < (1 / easterEggFrequency)) {
      easterEggRef.current.current = easterEggWords[Math.floor(Math.random() * easterEggWords.length)];
      easterEggRef.current.progress = 0;
      easterEggRef.current.column = columnIndex;
    }
    
    // If we're displaying an easter egg in this column
    if (easterEggRef.current.current && columnIndex === easterEggRef.current.column) {
      const word = easterEggRef.current.current;
      const charIndex = Math.floor(easterEggRef.current.progress);
      
      if (charIndex < word.length) {
        easterEggRef.current.progress += 0.3;
        return word[charIndex];
      } else {
        // Easter egg word complete, reset
        easterEggRef.current.current = null;
        easterEggRef.current.progress = 0;
        easterEggRef.current.column = -1;
      }
    }
    
    // Return normal random character
    return baseCharacters[Math.floor(Math.random() * baseCharacters.length)];
  }, [baseCharacters, easterEggWords]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create fade effect
    ctx.fillStyle = `rgba(0, 0, 0, 0.03)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.font = `${fontSize}px monospace`;
    
    const columns = Math.floor(canvas.width / fontSize);
    
    // Draw characters
    for (let i = 0; i < dropsRef.current.length && i < columns; i++) {
      const char = selectCharacter(i);
      const x = i * fontSize;
      const y = dropsRef.current[i] * fontSize;
      
      // Determine color and effects
      let fillStyle = `rgba(0, 255, 65, ${opacity})`;
      
      if (easterEggRef.current.current && i === easterEggRef.current.column) {
        // Make easter egg characters slightly brighter
        const brightness = 0.8 + (Math.sin(frameCountRef.current * 0.1) * 0.2);
        fillStyle = `rgba(0, 255, 65, ${brightness})`;
        
        // Add glow effect
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 3;
      } else {
        // Normal characters with slight variation
        const brightness = 0.7 + (Math.random() * 0.3);
        fillStyle = `rgba(0, 255, 65, ${brightness * opacity})`;
        ctx.shadowBlur = 0;
      }
      
      ctx.fillStyle = fillStyle;
      ctx.fillText(char, x, y);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Move drop down
      dropsRef.current[i] += dropSpeedsRef.current[i] || baseSpeed;
      
      // Reset drop if it reaches bottom
      if (dropsRef.current[i] * fontSize > canvas.height && Math.random() > 0.985) {
        dropsRef.current[i] = 0;
        dropSpeedsRef.current[i] = baseSpeed + (Math.random() * maxSpeed);
      }
    }
  }, [selectCharacter, fontSize, opacity, baseSpeed, maxSpeed]);

  const animate = useCallback(() => {
    draw();
    animationIdRef.current = requestAnimationFrame(animate);
  }, [draw]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const columns = Math.floor(canvas.width / fontSize);
    dropsRef.current = [];
    dropSpeedsRef.current = [];
    
    for (let i = 0; i < columns; i++) {
      dropsRef.current[i] = Math.random() * canvas.height;
      dropSpeedsRef.current[i] = baseSpeed + (Math.random() * maxSpeed);
    }
  }, [fontSize, baseSpeed, maxSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    resize();
    
    // Start animation
    animationIdRef.current = requestAnimationFrame(animate);

    // Setup resize listener
    window.addEventListener('resize', resize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [resize, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[-1] ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};