import React, { useEffect, useRef } from 'react';

export const AnimatedFavicon: React.FC = () => {
  const animationRef = useRef<number | null>(null);
  const imageLoadedRef = useRef<boolean>(false);
  const svgImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // 1. Preload the SVG favicon
    const img = new Image();
    img.src = '/favicon.svg';
    svgImageRef.current = img;

    // 2. Setup head link elements for all favicon sizes
    const setupFaviconLinks = (loadedImage: HTMLImageElement) => {
      const sizes = [16, 32, 48, 180, 512];
      const linkElements: { [key: number]: HTMLLinkElement } = {};

      sizes.forEach((size) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw the high-res SVG centered and scaled to this size
          ctx.drawImage(loadedImage, 0, 0, size, size);
          
          // Determine the correct relation attribute
          const rel = size === 180 ? 'apple-touch-icon' : 'icon';
          const type = 'image/png';
          
          // Find or create link element
          let link = document.querySelector(`link[sizes="${size}x${size}"]`) as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.setAttribute('sizes', `${size}x${size}`);
            link.setAttribute('rel', rel);
            link.setAttribute('type', type);
            document.head.appendChild(link);
          }
          link.href = canvas.toDataURL('image/png');
          linkElements[size] = link;
        }
      });
    };

    img.onload = () => {
      imageLoadedRef.current = true;
      setupFaviconLinks(img);
      startAnimationLoop();
    };

    // 3. Animation Loop (Canvas-based shine sweep & glow pulse)
    let lastTime = 0;
    let sweepStartTime = 0;
    const sweepDuration = 1200; // 1.2 seconds for the shine sweep
    const sweepInterval = 6000;  // Run sweep every 6 seconds
    let animatingSweep = false;

    // Create a 32x32 canvas specifically for the tab bar animated favicon
    const animCanvas = document.createElement('canvas');
    animCanvas.width = 32;
    animCanvas.height = 32;
    const animCtx = animCanvas.getContext('2d');

    // Find the primary 32x32 favicon link in document head (or create it)
    let mainFaviconLink = document.querySelector('link[rel="icon"][sizes="32x32"]') as HTMLLinkElement;
    if (!mainFaviconLink) {
      mainFaviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    }

    const drawFrame = (timestamp: number) => {
      if (!imageLoadedRef.current || !svgImageRef.current || !animCtx) return;

      if (lastTime === 0) {
        lastTime = timestamp;
        sweepStartTime = timestamp + 1000; // First sweep starts in 1 second
      }

      const elapsedSinceLastSweep = timestamp - sweepStartTime;

      // Check if we need to start a new sweep
      if (elapsedSinceLastSweep >= sweepInterval) {
        sweepStartTime = timestamp;
        animatingSweep = true;
      }

      const isInsideSweep = timestamp >= sweepStartTime && timestamp <= sweepStartTime + sweepDuration;

      // To keep CPU footprint at 0% during idle times, we only redraw when a sweep is active or starting
      if (isInsideSweep || animatingSweep) {
        const progress = Math.min((timestamp - sweepStartTime) / sweepDuration, 1);

        // Clear canvas
        animCtx.clearRect(0, 0, 32, 32);

        // A. Draw base SVG logo
        animCtx.drawImage(svgImageRef.current, 0, 0, 32, 32);

        // B. Add glowing light-sweep overlay using compositing
        animCtx.globalCompositeOperation = 'source-atop';

        const shineGrad = animCtx.createLinearGradient(0, 0, 32, 0);
        
        // Map the shine progress across the canvas width with safety margins
        const xOffset = -32 + progress * 96; 
        
        const gradStart = Math.max(0, Math.min(1, (xOffset) / 32));
        const gradPeak = Math.max(0, Math.min(1, (xOffset + 12) / 32));
        const gradEnd = Math.max(0, Math.min(1, (xOffset + 24) / 32));

        shineGrad.addColorStop(gradStart, 'rgba(255, 255, 255, 0)');
        shineGrad.addColorStop(gradPeak, 'rgba(255, 255, 255, 0.75)');
        shineGrad.addColorStop(gradEnd, 'rgba(255, 255, 255, 0)');

        animCtx.fillStyle = shineGrad;
        animCtx.fillRect(0, 0, 32, 32);

        // Restore default composite operation
        animCtx.globalCompositeOperation = 'source-over';

        // Update link elements
        if (mainFaviconLink) {
          mainFaviconLink.href = animCanvas.toDataURL('image/png');
        }

        if (progress >= 1) {
          animatingSweep = false;
        }
      }

      // Request next frame
      animationRef.current = requestAnimationFrame(drawFrame);
    };

    const startAnimationLoop = () => {
      if (animationRef.current === null) {
        animationRef.current = requestAnimationFrame(drawFrame);
      }
    };

    const stopAnimationLoop = () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    // 4. Visibility Handler to pause when tab is inactive
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startAnimationLoop();
      } else {
        stopAnimationLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopAnimationLoop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This is a behavior component and has no visual UI of its own
};
