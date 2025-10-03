"use client";

import { FaShare } from "react-icons/fa";

type ShareButtonProps = {
  childName: string;
};

export default function ShareButton({ childName }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Help ${childName} earn Christmas magic!`,
        text: `${childName} is working hard to be on Santa's nice list. Help spread some Christmas magic!`,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      });
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blueberry text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      <FaShare className="text-sm" />
      Share
    </button>
  );
}