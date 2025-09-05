import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0b0f19] text-gray-400">
      <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="text-2xl font-bold text-white">
            <span className="text-blue-500"></span> StackIt
          </div>
          <p className="text-sm mt-2">© 2025 StackIt. All rights reserved.</p>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;