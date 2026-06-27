import React, { useEffect, useRef } from 'react';

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Create an iframe to safely isolate the document.write() used by Adsterra
    // This prevents the ad script from wiping the React SPA document
    const iframe = document.createElement('iframe');
    iframe.width = '468';
    iframe.height = '60';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    iframe.title = 'Advertisement';
    
    containerRef.current.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                background: transparent; 
              }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              var atOptions = {
                'key' : '25719cb89c4d77e821362d4523fb61a9',
                'format' : 'iframe',
                'height' : 60,
                'width' : 468,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/25719cb89c4d77e821362d4523fb61a9/invoke.js"></script>
          </body>
        </html>
      `);
      doc.close();
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-6">
      <div 
        ref={containerRef} 
        className="w-[468px] h-[60px] max-w-full relative z-10 flex justify-center items-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800"
      >
        {/* The iframe will instantly overlay this placeholder when rendering */}
      </div>
    </div>
  );
}
