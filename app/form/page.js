'use client';
import React, { useState, useMemo } from 'react';
import SimpleTagInput from '../components/inputTagForm'; 
import Link from 'next/link';
import { addDoc, collection } from "firebase/firestore"; // <--- Firestore ইমপোর্ট ঠিক করা হয়েছে
// ফিক্স করা হয়েছে: সংকলন ত্রুটি এড়াতে Alias Path (@/lib/firebaseConfig) এর বদলে Relative Path ব্যবহার করা হয়েছে।
import { db } from '@/app/lib/firebaseConfig'; 

export default function Page() {
  // State variables for form fields
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentPost, setCurrentPost] = useState('');
  const [currentThana, setCurrentThana] = useState('');
  const [currentDistrict, setCurrentDistrict] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [permanentPost, setPermanentPost] = useState('');
  const [permanentThana, setPermanentThana] = useState('');
  const [permanentDistrict, setPermanentDistrict] = useState('');
  const [guardian, setGuardian] = useState('');
  const [dob, setDob] = useState('');
  // SimpleTagInput থেকে আসা Subjects array
  const [subjects, setSubjects] = useState([]); // Array state for subjects
  const [admissionDate, setAdmissionDate] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [roll, setRoll] = useState('');
  const [section, setSection] = useState('');
  const [batchTime, setBatchTime] = useState('');
  const [batchType, setBatchType] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [fee, setFee] = useState('');
  const [paid, setPaid] = useState('');

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // For custom message box
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const dueAmount = useMemo(() => {
    const totalFee = Number(fee) || 0;
    const amountPaid = Number(paid) || 0;
    return Math.max(0, totalFee - amountPaid);
  }, [fee, paid]);

  const inputClasses = 'w-full text-[#3b3939] placeholder-[#adb1ad] border focus:outline-none border-gray-300 rounded-md px-2 py-1 h-[45px] my-[3px] mx-[3px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300';
  
  // NOTE: Assuming SimpleTagInput is available and works as intended
  const handleTagsChange = (newTags) => {
    // নিশ্চিত করা হলো যেন subjects সবসময় একটি অ্যারে থাকে
    setSubjects(newTags || []);
  };

  const resetForm = () => {
    setStudentName(''); setFatherName(''); setFatherPhone(''); setMotherName(''); setMotherPhone('');
    setCurrentAddress(''); setCurrentPost(''); setCurrentThana(''); setCurrentDistrict('');
    setPermanentAddress(''); setPermanentPost(''); setPermanentThana(''); setPermanentDistrict('');
    setGuardian(''); setDob(''); setSubjects([]); setAdmissionDate(''); setSchoolName('');
    setClassName(''); setRoll(''); setSection(''); setBatchTime(''); setBatchType(''); 
    setPaymentType(''); setFee(''); setPaid('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null); // Clear previous messages
    
    // Basic validation check
    if (!studentName || !fatherPhone || !className || !paymentType) {
      setMessage('অনুগ্রহ করে প্রয়োজনীয় ঘরগুলো পূরণ করুন (নাম, বাবার ফোন, শ্রেণী, পেমেন্টের ধরন)।');
      setMessageType('error');
      setUploading(false);
      return;
    }

    try {
      const studentData = {
        studentName, fatherName, fatherPhone, motherName, motherPhone,
        currentAddress, currentPost, currentThana, currentDistrict,
        permanentAddress, permanentPost, permanentThana, permanentDistrict,
        guardian, dob, 
        subjects: subjects || [], // Ensure subjects is an array/empty array
        admissionDate, schoolName,
        className, roll, section, batchTime, batchType, paymentType,
        fee: Number(fee) || 0,
        paid: Number(paid) || 0,
        due: dueAmount,
        timestamp: new Date() // Firestore-এ Date অবজেক্ট ব্যবহার করা হয়েছে
      };

      if (paymentType === 'monthly') {
        const initialPaymentRecord = {
          paymentDate: admissionDate || new Date().toISOString().slice(0, 10), // Use admission date or current date
          amountPaid: Number(paid) || 0,
          dueAfterPayment: dueAmount,
          paymentTimestamp: new Date()
        };
        // Firestore-এ Array হিসেবে সংরক্ষণ করা সম্ভব 
        studentData.paymentRecords = [initialPaymentRecord]; 
      }
      
      // Firestore-এ ডেটা যোগ করার প্রক্রিয়া
      await addDoc(collection(db, "students"), studentData);

      setMessage('শিক্ষার্থীর ডেটা সফলভাবে সংরক্ষণ করা হয়েছে!');
      setMessageType('success');
      resetForm(); // Clear form after successful submission
      
    } catch (error) {
      console.error("Error adding document: ", error);
      setMessage(`ডেটা সংরক্ষণ করতে ত্রুটি: ${error.message}`);
      setMessageType('error');
      
    } finally {
      setUploading(false);
    }
  };

  const MessageDisplay = ({ message, type }) => {
    if (!message) return null;
    const classes = type === 'success' 
      ? 'bg-green-100 border-green-400 text-green-700' 
      : 'bg-red-100 border-red-400 text-red-700';

    return (
      <div className={`p-4 border-l-4 rounded-b shadow-md mb-4 ${classes}`} role="alert">
        <div className="flex justify-between items-center">
          <p className="font-bold">{type === 'success' ? 'সফল!' : 'ত্রুটি!'}</p>
          <span className="cursor-pointer text-xl" onClick={() => setMessage(null)}>&times;</span>
        </div>
        <p>{message}</p>
      </div>
    );
  };


  return (
    <div className='flex justify-center w-full min-h-screen bg-gray-50 p-6'>
      <div className='relative w-full sm:w-full md:w-[90%] lg:w-[90%] xl:w-[80%] 2xl:2-[50%] min-h-full rounded-lg shadow-xl bg-[url(/logo.jpg)] bg-contain bg-center bg-no-repeat'>
        {/* Adjusted Z-index and opacity for better mobile experience */}
        <div className="absolute inset-0 rounded-lg bg-white/95 backdrop-blur-sm"></div> 
        
        <div className='relative z-10 p-8'>
          <MessageDisplay message={message} type={messageType} /> {/* Message box here */}

          <div className='mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
            {/* NOTE: If 'logo.jpg' is local, you might need to adjust the path for Next.js */}
            <img src='/logo.jpg' alt='Robi Science Logo' className='w-16 h-16 rounded-full object-cover border border-gray-200' onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/03a819/ffffff?text=RS"; }} />
            <h1 className='text-[#03a819] text-3xl font-extrabold tracking-tight '>
              <span className='text-[red] '>Robi</span>  Science
            </h1>
            </div>
          </div>

          <hr className='border-t border-gray-300 w-full mt-2' />

          <form onSubmit={handleSubmit}>
            <div className='mt-8'>
            {/* Personal Information Section */}
            <p className='text-xl font-semibold text-[#043335d2] mb-3'>ব্যক্তিগত তথ্য</p>

            <p className='text-[#043335d2] mb-1'>শিক্ষার্থীর নাম</p>
            <input type="text" className={inputClasses} placeholder='নাম লিখুন' value={studentName} onChange={(e) => setStudentName(e.target.value)} required />

            <div className='mb-4'>
              <p className='text-[#043335d2] mb-1'>পিতার নাম ও ফোন নম্বর</p>
              <div className='flex flex-wrap gap-4'>
                <input type="text" className={`${inputClasses} flex-1 min-w-[45%]`} placeholder='পিতার নাম' value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                <input type="tel" className={`${inputClasses} flex-1 min-w-[45%]`} placeholder='ফোন নম্বর' value={fatherPhone} onChange={(e) => setFatherPhone(e.target.value)} required />
              </div>
            </div>

            <div className='mb-4'>
              <p className='text-[#043335d2] mb-1'>মাতার নাম ও ফোন নাম্বার</p>
              <div className='flex flex-wrap gap-4'>
                <input type="text" className={`${inputClasses} flex-1 min-w-[45%]`} placeholder='মাতার নাম' value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                <input type="tel" className={`${inputClasses} flex-1 min-w-[45%]`} placeholder='ফোন নম্বর' value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} />
              </div>
            </div>

            <p className='text-[#043335d2] mt-4 mb-1'>বর্তমান ঠিকানা(গ্রাম/মহল্লা)</p>
            <input type="text" className={inputClasses} placeholder='ঠিকানা লিখুন' value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} />
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <input type="text" className={inputClasses} placeholder='ডাকঘর' value={currentPost} onChange={(e) => setCurrentPost(e.target.value)} />
              <input type="text" className={inputClasses} placeholder='থানা' value={currentThana} onChange={(e) => setCurrentThana(e.target.value)} />
              <input type="text" className={inputClasses} placeholder='জেলা' value={currentDistrict} onChange={(e) => setCurrentDistrict(e.target.value)} />
            </div>

            <p className='text-[#043335d2] mt-4 mb-1'>স্থায়ী ঠিকানা(গ্রাম/মহল্লা)</p>
            <input type="text" className={inputClasses} placeholder='ঠিকানা লিখুন' value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} />
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <input type="text" className={inputClasses} placeholder='ডাকঘর' value={permanentPost} onChange={(e) => setPermanentPost(e.target.value)} />
              <input type="text" className={inputClasses} placeholder='থানা' value={permanentThana} onChange={(e) => setPermanentThana(e.target.value)} />
              <input type="text" className={inputClasses} placeholder='জেলা' value={permanentDistrict} onChange={(e) => setPermanentDistrict(e.target.value)} />
            </div>

            <p className='text-[#043335d2] mt-4 mb-1'>পিতা মাতার অনুপস্থিতিতে অভিভাবকের নাম ও ঠিকানা</p>
            <input type="text" className={inputClasses} placeholder='নাম ও ঠিকানা লিখুন' value={guardian} onChange={(e) => setGuardian(e.target.value)} />

            <div className='flex flex-wrap gap-4 mt-4'>
              <div className='flex-1 min-w-[45%]'>
                <p className='text-[#043335d2] mb-1'>জন্ম তারিখ</p>
                <input type="date" className={inputClasses} value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className='flex-1 min-w-[45%]'>
                <p className='text-[#043335d2] mb-1'>ভর্তি তারিখ</p>
                <input type="date" className={inputClasses} value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
              </div>
            </div>
            
            {/* Academic Information Section */}
            <p className='text-xl font-semibold text-[#043335d2] mt-8 mb-3'>শিক্ষাগত ও ব্যাচ তথ্য</p>

            <p className='text-[#043335d2] mt-4 mb-1'>অধ্যায়নরত শিক্ষাপ্রতিষ্ঠানের নাম</p>
            <input type="text" className={inputClasses} placeholder='নাম ও ঠিকানা লিখুন' value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <input type="text" className={inputClasses} placeholder='শ্রেণী' value={className} onChange={(e) => setClassName(e.target.value)} required />
              <input type="text" className={inputClasses} placeholder='রোল' value={roll} onChange={(e) => setRoll(e.target.value)} />
              <input type="text" className={inputClasses} placeholder='বিভাগ' value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
            
            {/* Tag Input Placeholder - assuming this is SimpleTagInput */}
            <div className='w-full mt-4'>
              <p className='text-[#043335d2] mb-1'>বিষয়সমূহ (Subjects)</p>
              <SimpleTagInput onTagsChange={handleTagsChange} />
            </div>

            <div className='flex flex-wrap gap-4 mt-2'>
              <input type="text" className={`${inputClasses} flex-1 min-w-[45%]`} placeholder='ব্যাচের সময় (যেমন: 10:00 AM)' value={batchTime} onChange={(e) => setBatchTime(e.target.value)} />
              <select className={`${inputClasses} flex-1 min-w-[45%]`} value={batchType} onChange={(e) => setBatchType(e.target.value)}>
                <option value="">ব্যাচ</option>
                <option value="class">ক্লাস</option>
                <option value="exam">এক্সাম</option>
                <option value="both">ক্লাস ও এক্সাম</option>
              </select>
            </div>

            {/* Payment Information Section */}
            <p className='text-xl font-semibold text-[#043335d2] mt-8 mb-3'>পেমেন্ট তথ্য</p>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <select className={inputClasses} value={paymentType} onChange={(e) => setPaymentType(e.target.value)} required>
                <option value="">পেমেন্টের ধরন</option>
                <option value="monthly">মাসিক</option>
                <option value="6month">৬ মাস ভিত্তিক কোর্স</option>
                <option value="yearly">বছর ভিত্তিক কোর্স</option>
              </select>
              <input type="number" className={inputClasses} placeholder='মোট ফি' value={fee} onChange={(e) => setFee(e.target.value)} />
              <input type="number" className={inputClasses} placeholder='প্রদত্ত ফি' value={paid} onChange={(e) => setPaid(e.target.value)} />
              <div className='w-full border border-gray-300 rounded-md px-2 py-1 h-[45px] my-[3px] mx-[3px] text-red-600 font-bold bg-gray-100 flex items-center justify-center text-lg'>বাকি: {dueAmount} ৳</div>
            </div>
            </div>

            <button 
              type="submit" 
              disabled={uploading} 
              className='bg-green-500 w-full rounded-[5px] mt-10 h-14 text-2xl text-white font-bold hover:text-[26px] hover:bg-green-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
            {uploading ? 'সংরক্ষণ চলছে...' : 'ফর্ম জমা দিন'}
            </button>
          </form>
        <button className='bg-blue-500 text-white px-4 py-2 rounded mt-4'>
  <Link href="/main">Student DataBase</Link>
</button>
          <p className='text-[#bbb8b8] text-[13px] mt-5'>Made By ❤ Alamin</p>
        </div>
      </div>
    </div>
  );
}