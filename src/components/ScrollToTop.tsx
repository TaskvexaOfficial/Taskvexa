import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Restore scroll position on pathname change
    const savedWindowPos = sessionStorage.getItem(`scroll_win_${pathname}`);
    const savedContainerPos = sessionStorage.getItem(`scroll_cont_${pathname}`);

    // Wait slightly to ensure page has rendered and elements are available
    const timer = setTimeout(() => {
      // Restore window scroll
      if (savedWindowPos !== null) {
        window.scrollTo({ top: parseInt(savedWindowPos, 10), behavior: 'instant' as any });
      } else {
        window.scrollTo(0, 0);
      }

      // Restore container scroll (for dashboards that scroll a child element)
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        if (savedContainerPos !== null) {
          scrollContainer.scrollTo({ top: parseInt(savedContainerPos, 10), behavior: 'instant' as any });
        } else {
          scrollContainer.scrollTo(0, 0);
        }
      }
    }, 150);

    // Google Analytics 4 Page View Tracking for Single Page Application
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_path: pathname,
        page_search: window.location.search,
        page_title: document.title,
      });
    }

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    // 2. Save scroll position on scroll
    const savePositions = () => {
      // Save window scroll
      sessionStorage.setItem(`scroll_win_${pathname}`, window.scrollY.toString());

      // Save custom container scroll
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        sessionStorage.setItem(`scroll_cont_${pathname}`, scrollContainer.scrollTop.toString());
      }
    };

    let scrollTimeout: any;
    const handleScroll = () => {
      // Debounce scroll save to prevent excessive storage write on passive scroll
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(savePositions, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Periodically search for scroll container to attach
    const containerTimer = setInterval(() => {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        clearInterval(containerTimer);
      }
    }, 500);

    return () => {
      clearTimeout(scrollTimeout);
      clearInterval(containerTimer);
      window.removeEventListener('scroll', handleScroll);
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [pathname]);

  return null;
}

