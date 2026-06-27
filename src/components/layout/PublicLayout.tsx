import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Menu, X, Twitter, Instagram, Linkedin } from 'lucide-react';

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden selection:bg-[#4F46E5] selection:text-white flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight"><span className="text-slate-900 dark:text-white">Task</span><span className="text-blue-500">vexa</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/features" className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/features' ? 'text-[#4F46E5]' : ''}`}>Features</Link>
            <Link to="/how-it-works" className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/how-it-works' ? 'text-[#4F46E5]' : ''}`}>How it Works</Link>
            <Link to="/reviews" className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/reviews' ? 'text-[#4F46E5]' : ''}`}>Reviews</Link>
            <Link to="/blog" className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/blog' ? 'text-[#4F46E5]' : ''}`}>Blog</Link>
            <Link to="/faq" className={`hover:text-[#4F46E5] transition-colors ${location.pathname === '/faq' ? 'text-[#4F46E5]' : ''}`}>FAQ</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth" className="text-sm font-semibold hover:opacity-80 transition-opacity text-slate-900">Log In</Link>
            <Link to="/auth">
              <Button className="rounded-full shadow-md px-6 bg-[#0F172A] hover:bg-black text-white">Get Started</Button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden shadow-xl absolute w-full top-20"
            >
              <div className="px-6 py-4 flex flex-col gap-4 font-medium text-slate-600">
                <Link to="/features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
                <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
                <Link to="/reviews" onClick={() => setMobileMenuOpen(false)}>Reviews</Link>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
                <div className="h-px bg-slate-100 my-2"></div>
                <Link to="/auth" className="w-full text-center py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl bg-[#4F46E5] text-white">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-6">
                  <Logo className="w-8 h-8" />
                  <span className="text-xl font-bold tracking-tight"><span className="text-slate-900 dark:text-white">Task</span><span className="text-blue-500">vexa</span></span>
              </Link>
              <p className="text-slate-500 mb-6 max-w-xs leading-relaxed">The premium destination for completing tasks and earning real money in your spare time.</p>
              <div className="flex flex-col gap-2 mb-6 text-sm font-medium">
                  <a href="mailto:taskvexa.offical@gmail.com" className="text-slate-600 hover:text-[#4F46E5] transition-colors">
                      taskvexa.offical@gmail.com
                  </a>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                  <a href="#" className="hover:text-[#4F46E5] transition-colors"><Twitter className="w-5 h-5"/></a>
                  <a href="#" className="hover:text-[#4F46E5] transition-colors"><Instagram className="w-5 h-5"/></a>
                  <a href="#" className="hover:text-[#4F46E5] transition-colors"><Linkedin className="w-5 h-5"/></a>
              </div>
            </div>
            
            <div>
                <h4 className="font-bold text-slate-900 mb-6 tracking-wide">Platform</h4>
                <ul className="space-y-4 text-slate-600 font-medium">
                  <li><Link to="/how-it-works" className="hover:text-[#4F46E5] transition-colors">How it Works</Link></li>
                  <li><Link to="/features" className="hover:text-[#4F46E5] transition-colors">Explore Features</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-slate-900 mb-6 tracking-wide">Company</h4>
                <ul className="space-y-4 text-slate-600 font-medium">
                  <li><Link to="/about" className="hover:text-[#4F46E5] transition-colors">About Us</Link></li>
                  <li><Link to="/blog" className="hover:text-[#4F46E5] transition-colors">Blog</Link></li>
                  <li><Link to="/contact" className="hover:text-[#4F46E5] transition-colors">Contact</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-slate-900 mb-6 tracking-wide">Legal</h4>
                <ul className="space-y-4 text-slate-600 font-medium">
                  <li><Link to="/terms-and-conditions" className="hover:text-[#4F46E5] transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy-policy" className="hover:text-[#4F46E5] transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/withdrawal-policy" className="hover:text-[#4F46E5] transition-colors">Withdrawal Policy</Link></li>
                  <li><Link to="/referral-rules" className="hover:text-[#4F46E5] transition-colors">Referral Rules</Link></li>
                  <li><Link to="/faq" className="hover:text-[#4F46E5] transition-colors">Support Center</Link></li>
                </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-medium">
            <p>© 2026 Taskvexa Inc. All rights reserved.</p>
          </div>
        </footer>
    </div>
  );
}
