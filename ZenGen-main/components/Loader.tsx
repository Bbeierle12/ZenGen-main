import React from 'react';

export const Loader = ({ text }: { text: string }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-teal-500/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-teal-200 text-lg font-light tracking-wide animate-pulse">{text}</p>
    </div>
  );
};
