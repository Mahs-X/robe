"use client";

import React, { useState,useEffect, useMemo } from 'react';

// আপনার মূল ইনপুট ক্লাসটি এখানে ধরে নেওয়া হলো
const inputClasses = 'w-full px-4 py-2 border text-[red] border-[#043335d2] rounded-md focus:ring-2 focus:ring-[#043335d2] focus:outline-none transition-all duration-200'; 

const SimpleTagInput = ({ onTagsChange }) => {
  // Suggestions (পরামর্শ) যা আপনি নির্দিষ্ট করেছেন
  const suggestions = useMemo(() => [
    "Math", "Higher-Math", "All", "Bangla-1st", "Bangla-2nd", 
    "English-1st", "English-2nd", "Physics", "Chemistry", "Biology"
  ], []);

  // tags: ট্যাগগুলির তালিকা
  const [tags, setTags] = useState([]);
  // inputValue: ইনপুট ফিল্ডে বর্তমান লেখা
  const [inputValue, setInputValue] = useState('');

  // 1. Ghost Text Calculation (Ghost Text গণনা)
  const getGhostText = (currentInput) => {
    if (!currentInput) return '';

    // Suggestions list থেকে প্রথম মিলটি খুঁজে নেওয়া
    const match = suggestions.find(s => 
      s.toLowerCase().startsWith(currentInput.toLowerCase())
    );

    // যদি কোনো মিল খুঁজে পাওয়া যায়, তাহলে টাইপ করা অংশের পরের অংশটি Ghost Text হিসেবে return করা
    if (match) {
      // এই লাইনে পরিবর্তন করা হয়েছে: শুধুমাত্র পরের অংশটি slice করে নেওয়া হচ্ছে
      return match.slice(currentInput.length);
    }
    return '';
  };

  const ghostText = getGhostText(inputValue);
  
  // 2. ট্যাগ যোগ করা এবং Tab Key Handling
  const handleKeyDown = (e) => {
    // If Tab is pressed AND there is ghost text, autocomplete
    // Tab চাপলে এবং Ghost Text থাকলে, Autocomplete হবে
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault(); // Default Tab behavior বন্ধ করে
      setInputValue(inputValue + ghostText); // Autocomplete করে
      return;
    }

    // If Enter is pressed, add tag
    // Enter চাপলে, ট্যাগ যোগ হবে
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      
      // Check if user completed the suggestion and use the suggested tag
      // ইউজার যা টাইপ করেছে এবং যদি কোনো Ghost Text থাকে (Tab না চাপলেও), তবে পুরো শব্দটি ট্যাগ হিসেবে ধরে নেবে।
      const newTag = (ghostText ? inputValue + ghostText : inputValue).trim();
      
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
      return;
    }
  };

useEffect(() => {
        
        if (onTagsChange) {
            onTagsChange(tags);
        }
    }, [tags, onTagsChange]);



  // 3. ট্যাগ মুছে ফেলার ফাংশন
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // আপনার দেওয়া মূল কাঠামো:
  return (
    <div className='w-1/2 lg:w-1/2 mx-auto '>
      <p className='text-[#363d3dd2] mb-1'>পড়তে ইচ্ছুক</p>
      
      {/* মূল কন্টেইনার: relative position ব্যবহার করা হয়েছে যাতে Ghost Text ঠিক জায়গায় বসে */}
      <div 
        className={`flex flex-wrap items-center text-[red] border border-[#aca1a1] ${inputClasses} p-1 relative`} 
      >
        
        {/* ট্যাগগুলি রেন্ডার করা হচ্ছে */}
        {tags.map((tag, index) => (
          <div 
            key={index} 
            className="flex items-center bg-gray-200 text-[#252020] text-[16px] font-bold px-2 py-1 rounded mr-1 mb-1"
          >
            {/* ট্যাগ লেখা */}
            {tag}
            
            {/* ট্যাগ মুছে ফেলার বাটন (Cross Icon) */}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="ml-2 text-black/60 hover:text-black transition-colors duration-150 focus:outline-none"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ))}

        {/* --- Ghost Autocomplete Layer --- */}
        {/* Ghost Text রেন্ডারিং-এর জন্য একটি কন্টেইনার */}
        <div className="relative flex text-amber-300 grow min-w-[100px] p-2">
            
            {/* Ghost Text (হালকা লেখা) - এটি Absolute position এ থাকবে */}
            <span 
              className="absolute top-1/2 bg-gray-200 rounded-[3px] -translate-y-1/2 left-2 pointer-events-none text-[#000000]"
              style={{ 
                padding: '0 2px',
                marginLeft: "20px",
                // Ghost Text এর অপাসিটি কমানো হলো
                opacity: 0.9,
                // এটি নিশ্চিত করে যে Ghost Text ট্যাগগুলোর ঠিক পরেই শুরু হবে
                left: '40px', 
              }} 
            >
              {/* শুধুমাত্র Ghost Text এর অংশটি দেখাবে, টাইপ করা অংশ দেখাবে না। */}
              {ghostText}
            </span>

            {/* আসল ইনপুট ফিল্ড (Live Input) */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 && !inputValue ? "আপনার পছন্দের বিষয়গুলি লিখুন..." : ""}
              // Ghost Text এর উপর দিয়ে টাইপ করার জন্য ইনপুটটিকে স্বচ্ছ (transparent) রাখা হয়েছে।
              className="flex grow min-w-[100px] border-none focus:ring-0 focus:outline-none p-2 text-[#646060] bg-transparent relative z-10" 
              style={{
                // শুধুমাত্র Ghost Text দেখানোর জন্য, টাইপ করা অক্ষরগুলির রঙ পুরোপুরি স্বচ্ছ করা হলো।
                color: '#646060',
                marginLeft:"2px",
                // কিন্তু যখন Ghost Text নেই, তখন রঙ স্বাভাবিক (opacity 1) রাখা দরকার যাতে প্লেসহোল্ডার এবং টাইপ করা টেক্সট দেখা যায়
                opacity: ghostText ? 1 : 1, // অপাসিটি 1 রাখা হলো
                caretColor: 'black' // কার্সারের রঙ কালো রাখা হলো যাতে টাইপ করার সময় কার্সার দেখা যায়।
              }}
            />
        </div>

      </div>
       <p className="text-sm text-gray-500 mt-2">
            পরামর্শ স্বয়ংসম্পূর্ণ করতে <kbd className="px-1 py-0.5 text-xs font-semibold bg-gray-200 rounded-sm">Tab</kbd> চাপুন।
       </p>
    </div>
  );
};

export default SimpleTagInput;