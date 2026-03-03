import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="apple-card overflow-hidden flex flex-col h-full bg-white relative p-5">
      <div className="h-28 w-full bg-gray-100 rounded-2xl animate-shimmer mb-12"></div>
      <div className="flex justify-center -mt-16 mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 animate-shimmer ring-4 ring-white shadow-lg"></div>
      </div>
      <div className="space-y-3 flex flex-col items-center">
        <div className="h-4 w-3/4 bg-gray-100 rounded-full animate-shimmer"></div>
        <div className="h-3 w-1/2 bg-gray-50 rounded-full animate-shimmer"></div>
      </div>
      <div className="mt-8 space-y-2">
        <div className="h-2 w-full bg-gray-50 rounded-full animate-shimmer"></div>
        <div className="h-2 w-full bg-gray-50 rounded-full animate-shimmer"></div>
      </div>
      <div className="mt-auto pt-6">
        <div className="h-10 w-full bg-gray-100 rounded-xl animate-shimmer"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-4 w-1/3">
          <div className="h-10 bg-gray-200 rounded-xl animate-shimmer w-full"></div>
          <div className="h-4 bg-gray-100 rounded-xl animate-shimmer w-2/3"></div>
        </div>
        <div className="h-16 w-48 bg-gray-100 rounded-2xl animate-shimmer"></div>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-shimmer"></div>)}
      </div>
      <div className="h-64 bg-gray-100 rounded-[40px] animate-shimmer"></div>
    </div>
  );
};