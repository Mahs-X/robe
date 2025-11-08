'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
// Auth Imports (আপনার দেওয়া পাথ অনুযায়ী)
import { auth, onAuthStateChanged, logOut } from '@/app/lib/auth'; 
import LoginForm from '@/app/LogInForm'; // আপনার দেওয়া পাথ অনুযায়ী
// Lucide React Icons
import { Search, Plus, Bell, Menu, X, Calendar, DollarSign, BookOpen, Clock, Home, MapPin, School, Phone, Users, UserCheck, Briefcase, FileText, LogIn, Loader2, Edit, Save, RefreshCw } from 'lucide-react'; 

// --- IMPORTANT: Firebase Config ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (Assuming this runs only once)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// -----------------------------------------------------------------

// Helper function for Course Type Badge styling (UNCHANGED)
const getCourseBadge = (paymentType) => {
    let text = "N/A";
    let style = "bg-gray-100 text-gray-800";

    switch (paymentType) {
        case 'monthly':
            text = "Monthly";
            style = "bg-yellow-100 text-yellow-800";
            break;
        case '6month':
            text = "6 Months";
            style = "bg-indigo-100 text-indigo-800";
            break;
        case 'yearly':
            text = "Yearly";
            style = "bg-blue-100 text-blue-800";
            break;
        default:
            text = paymentType || "N/A";
            break;
    }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>{text}</span>;
};


// Helper function for Payment Status Badge styling (UNCHANGED)
const getPaymentBadge = (due) => {
    if (due && due > 0) {
        return (
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                Due: {due} ৳
            </span>
        );
    }
    return (
        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Paid
        </span>
    );
};

// --- Student Profile Sidebar Component (FIXED) ---
const StudentProfileSidebar = ({ student, isOpen, onClose, onDataUpdate }) => { 
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    
    // --- FIX APPLIED: student?.due ব্যবহার করা হয়েছে ---
    const [isDueEditing, setIsDueEditing] = useState(false);
    const [newDueAmount, setNewDueAmount] = useState(student?.due || 0); // <--- এখানে null চেক করা হয়েছে
    const [updateMessage, setUpdateMessage] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    // ----------------------------------------

    // Reset states when a new student is selected or sidebar is closed
    useEffect(() => {
        if (!isOpen) {
            setIsImageLoaded(false);
        }
        // Reset Due states when student changes or sidebar opens/closes
        if (student) {
            // student অবজেক্ট বিদ্যমান থাকলে, useEffect এর মাধ্যমে মান সেট করা হচ্ছে।
            setNewDueAmount(student.due || 0); 
        } else {
             // student null হলে, মান 0 তে সেট করা হচ্ছে
            setNewDueAmount(0); 
        }
        setIsDueEditing(false);
        setUpdateMessage(null);
    }, [isOpen, student]); // student এখন dependency

    if (!student || !isOpen) return null; // এই গেইটটি এখন নিশ্চিন্তে ব্যবহার করা যাবে।

    // Helper for formatting date (UNCHANGED)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Card Component for clean data display (UNCHANGED)
    const InfoCard = ({ icon: Icon, title, value, color = 'text-gray-700' }) => (
        <div className="flex items-start p-3 mt-3 bg-white rounded-lg shadow-sm border border-gray-100 transition duration-150 hover:border-blue-300">
            <div className={`p-2 rounded-full bg-blue-50 ${color} shrink-0 mr-3`}>
                <Icon size={20} />
            </div>
            <div className="min-w-0"> 
                <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
                <p className={`text-sm font-semibold ${color} warp-break`}>{value}</p> 
            </div>
        </div>
    );
    
    // --- Update Due Amount Handler (UNCHANGED LOGIC) ---
    const handleUpdateDue = async () => {
        if (!student.id || updateLoading) return;

        setUpdateLoading(true);
        setUpdateMessage(null);

        // Calculate new paid amount based on the new due amount and total fee
        const newPaidAmount = Math.max(0, (student.fee || 0) - Number(newDueAmount));
        const finalDue = Number(newDueAmount);
        
        try {
            const studentRef = doc(db, "students", student.id);
            
            // Create the update object
            const updatePayload = {
                due: finalDue,
                // Automatically recalculate paid amount to maintain consistency
                paid: newPaidAmount, 
            };
            
            await updateDoc(studentRef, updatePayload);
            
            setUpdateMessage(`Due Amount সফলভাবে ${finalDue} ৳ এ আপডেট করা হয়েছে!`);
            setIsDueEditing(false);
            
            // Call the parent function to refresh the main list
            if(onDataUpdate) onDataUpdate();

        } catch (error) {
            console.error("Error updating document: ", error);
            setUpdateMessage(`আপডেট ব্যর্থ হয়েছে: ${error.message}`);
        } finally {
            setUpdateLoading(false);
        }
    };
    // -------------------------------------

    const profileImageSrc = isImageLoaded 
        ? (student.studentsProfileImage || '/profileOne.jpg') 
        : '/profileOne.jpg'; 

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-[95%] sm:max-w-[420px] lg:max-w-96 bg-gray-50 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header Section (Profile Image & Name) */}
                <div className="bg-linear-to-br from-[#54b1f0ce] to-[#a85cd488] p-6 flex flex-col items-center relative shadow-lg">
                    <button
                        className="absolute top-4 left-4 p-1 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
                        onClick={onClose}
                        aria-label="Close profile sidebar"
                    >
                        <X size={24} />
                    </button>
                    
                    {/* Profile Image with Click-to-Load Logic */}
                    <div 
                        className="relative w-28 h-28 rounded-full border-4 border-white object-cover shadow-xl mb-3 cursor-pointer overflow-hidden transition duration-300 hover:scale-105"
                        onClick={() => setIsImageLoaded(true)}
                        title={isImageLoaded ? "Real Image Loaded" : "Click to load actual profile image"}
                    >
                        <img 
                            src={profileImageSrc} 
                            alt={student.studentName} 
                            className="w-full h-full object-cover"
                        />
                            {!isImageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-bold p-1">
                                Tap to Load
                            </div>
                        )}
                    </div>
                    {/* ------------------------------------------------- */}

                    <h2 className="text-xl font-bold text-white mb-1 text-center px-2">{student.studentName}</h2>
                    <div className="flex space-x-2 mb-3">
                        {getCourseBadge(student.paymentType)}
                        {/* Use the current newDueAmount for the badge display */}
                        {getPaymentBadge(Number(newDueAmount))} 
                    </div>
                    
                    {/* Notice and Result Buttons (UNCHANGED) */}
                    <div className='flex space-x-3 w-full justify-center'>
                            <button className='flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 transition text-white text-sm font-semibold py-2 px-3 rounded-lg'>
                                <Bell size={16} /> Notice
                            </button>
                        <button className='flex-1 flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 transition text-white text-sm font-semibold py-2 px-3 rounded-lg'>
                            <FileText size={16} /> Result
                        </button>
                    </div>
                    {/* -------------------------------------- */}
                </div>

                {/* Content Area (Scrollable) */}
                <div className="p-4 space-y-5 overflow-y-auto h-[calc(100vh-190px)]"> 
                    
                    {/* Update Message Display */}
                    {updateMessage && (
                        <div className={`p-3 rounded-lg shadow-md text-sm font-medium ${updateMessage.includes('সফল') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {updateMessage}
                        </div>
                    )}
                    
                    {/* 1. Academic Information (UNCHANGED) */}
                    <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-blue-500">
                        <h3 className="flex items-center text-base font-semibold text-blue-600 mb-3"><School size={16} className='mr-2' /> Academic Info</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <InfoCard icon={Briefcase} title="School Name" value={student.schoolName || 'N/A'} />
                            <InfoCard icon={UserCheck} title="Roll Number" value={student.roll || 'N/A'} color='text-purple-700' />
                            <InfoCard icon={BookOpen} title="Class & Section" value={`Class ${student.className} (${student.section || 'N/A'})`} color='text-teal-700' />
                            <InfoCard icon={Calendar} title="Date of Birth" value={formatDate(student.dob)} />
                            <InfoCard icon={Clock} title="Batch Time/Type" value={`${student.batchTime} / ${student.batchType}`} color='text-pink-700' />
                            <InfoCard icon={Briefcase} title="Subjects" value={(student.subjects || []).join(', ') || 'N/A'} />
                        </div>
                    </div>

                    {/* 2. Financial Information (MODIFIED - Added Edit Due) */}
                    <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-green-500">
                        <h3 className="flex items-center text-base font-semibold text-green-600 mb-3"><DollarSign size={16} className='mr-2' /> Financial Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoCard icon={DollarSign} title="Total Fee" value={`${student.fee || 0} ৳`} color='text-green-700' />
                            <InfoCard icon={DollarSign} title="Paid Amount" value={`${student.paid || 0} ৳`} color='text-green-700' />
                            
                            {/* --- Due Amount with Edit Button --- */}
                            <div className="relative col-span-2 sm:col-span-1">
                                <InfoCard icon={DollarSign} title="Due Amount" value={`${newDueAmount} ৳`} color='text-red-700' />
                                <button
                                    onClick={() => {
                                        setIsDueEditing(prev => !prev);
                                        setNewDueAmount(student.due || 0); // Reset to current value on toggle
                                        setUpdateMessage(null); // Clear message on toggle
                                    }}
                                    className={`absolute top-4 right-4 p-1 rounded-full text-white transition duration-200 ${isDueEditing ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                    title={isDueEditing ? "Cancel Edit" : "Edit Due Amount"}
                                    disabled={updateLoading}
                                >
                                    {isDueEditing ? <X size={16} /> : <Edit size={16} />}
                                </button>
                            </div>
                            {/* --------------------------------- */}

                            <InfoCard icon={Calendar} title="Admission Date" value={formatDate(student.admissionDate)} />
                        </div>

                        {/* --- Due Amount Edit Input Field --- */}
                        {isDueEditing && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className='text-sm font-semibold text-gray-700 mb-2'>নতুন বাকি টাকার পরিমাণ:</h4>
                                <div className='flex space-x-2'>
                                    <input 
                                        type="number"
                                        value={newDueAmount}
                                        onChange={(e) => setNewDueAmount(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder="Enter new Due Amount"
                                        required
                                        min="0"
                                    />
                                    <button
                                        onClick={handleUpdateDue}
                                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-red-400"
                                        disabled={updateLoading || Number(newDueAmount) < 0 || Number(newDueAmount) === Number(student.due)}
                                        title="Save Due Amount"
                                    >
                                        {updateLoading ? <RefreshCw size={18} className='animate-spin' /> : <Save size={18} />}
                                        {updateLoading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* ------------------------------------- */}
                    </div>

                    {/* 3. Contact & Address (UNCHANGED) */}
                    <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-indigo-500">
                        <h3 className="flex items-center text-base font-semibold text-indigo-600 mb-3"><Phone size={16} className='mr-2' /> Contact Info</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <InfoCard icon={Users} title="Father's Info" value={`${student.fatherName || 'N/A'}, ${student.fatherPhone || 'N/A'}`} />
                            <InfoCard icon={Users} title="Mother's Info" value={`${student.motherName || 'N/A'}, ${student.motherPhone || 'N/A'}`} />
                            <InfoCard icon={UserCheck} title="Guardian" value={student.guardian || 'N/A'} color='text-orange-700' />
                        </div>
                    </div>

                    {/* 4. Address Details (UNCHANGED) */}
                    <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-yellow-500">
                        <h3 className="flex items-center text-base font-semibold text-yellow-700 mb-3"><MapPin size={16} className='mr-2' /> Address Details</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <InfoCard 
                                icon={Home} 
                                title="Current Address" 
                                value={`${student.currentAddress || 'N/A'}, ${student.currentPost || ''}, ${student.currentThana || ''}, ${student.currentDistrict || 'N/A'}`} 
                                color='text-gray-800'
                            />
                            <InfoCard 
                                icon={MapPin} 
                                title="Permanent Address" 
                                value={`${student.permanentAddress || 'N/A'}, ${student.permanentPost || ''}, ${student.permanentThana || ''}, ${student.permanentDistrict || 'N/A'}`} 
                                color='text-gray-800'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// --- END OF Student Profile Sidebar Component ---


export default function StudentsList() {
    // --- AUTH STATES (UNCHANGED) ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true); 
    const [authError, setAuthError] = useState(null); 
    const [studentsLoading, setStudentsLoading] = useState(false); 
    // -----------------------

    // UNCHANGED STATES AND LOGIC FOR STUDENTS LIST...
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
    const [selectedStudentData, setSelectedStudentData] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [filterInputs, setFilterInputs] = useState({
        className: '', batchType: '', batchTime: '', paymentStatus: '', course: '', subject: ''
    });
    const [appliedSearchName, setAppliedSearchName] = useState('');
    const [appliedFilters, setAppliedFilters] = useState(filterInputs);

    // Selection States
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Data Fetching Function (UNCHANGED)
    const fetchStudents = useCallback(async () => {
        setStudentsLoading(true);
        try {
            const q = query(collection(db, "students"), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(data);
            setStudentsLoading(false);
        } catch (err) {
            console.error("Error fetching students (Permission Denied?): ", err);
            if (err.code === 'permission-denied') {
                 setAuthError("You are logged in, but unauthorized to view data. Check Security Rules.");
            } else {
                setAuthError("An unexpected error occurred during data fetching.");
            }
            setStudentsLoading(false);
        }
    }, []); 

    // --- AUTHENTICATION CHECK useEffect (UNCHANGED) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setAuthError(null); 
                fetchStudents(); // Load student data only if a user is logged in
            } else {
                setIsAuthenticated(false);
                setStudents([]); 
                setAuthError(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, [fetchStudents]); 
    // ------------------------------------

    // Filter Handlers (UNCHANGED)
    const handleApplyFilters = () => {
        setAppliedSearchName(searchInput);
        setAppliedFilters(filterInputs);
    };

    const handleFilterInputChange = (e) => {
        const { name, value } = e.target;
        setFilterInputs(prev => ({ ...prev, [name]: value }));
    };

    // Filtered Students List (Memoized) (UNCHANGED)
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (appliedSearchName && !student.studentName.toLowerCase().includes(appliedSearchName.toLowerCase())) return false;
            if (appliedFilters.className && student.className !== appliedFilters.className) return false;
            if (appliedFilters.batchType && student.batchType !== appliedFilters.batchType) return false;
            if (appliedFilters.batchTime && student.batchTime !== appliedFilters.batchTime) return false;

            if (appliedFilters.paymentStatus) {
                if (appliedFilters.paymentStatus === 'due' && (student.due === undefined || student.due <= 0)) return false;
                if (appliedFilters.paymentStatus === 'paid' && student.due > 0) return false;
            }

            if (appliedFilters.course && student.paymentType !== appliedFilters.course) return false;
            if (appliedFilters.subject && appliedFilters.subject !== 'All' && (!student.subjects || !student.subjects.includes(appliedFilters.subject))) return false;

            return true;
        });
    }, [students, appliedSearchName, appliedFilters]);

    // Selection Handlers (UNCHANGED)
    const toggleSelectStudent = (id) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedStudents([]);
            setSelectAll(false);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
            setSelectAll(true);
        }
    };

    // Handlers for Profile Sidebar (UNCHANGED)
    const handleOpenProfileSidebar = useCallback((student) => {
        setSelectedStudentData(student);
        setIsProfileSidebarOpen(true);
    }, []);

    const handleCloseProfileSidebar = useCallback(() => {
        setIsProfileSidebarOpen(false);
    }, []);

    // --- LOGOUT HANDLER (UNCHANGED) ---
    const handleLogout = async () => {
        setAuthLoading(true); 
        await logOut();
    };
    // ---------------------------

    // --- CONDITIONAL RENDERING (UNCHANGED) ---
    if (authLoading) return <p className='text-center mt-10 text-[#2c3e50] font-bold text-xl'>Checking Admin Access... 🔑</p>;
    if (!isAuthenticated) return <LoginForm />; 
    if (studentsLoading) return <p className='text-center mt-10 text-[#2c3e50]'><Loader2 className='inline animate-spin mr-2' size={20} /> Loading students data from Firestore...</p>;
    if (authError) return (
        <div className='flex flex-col items-center justify-center min-h-screen p-6 bg-red-50'>
            <p className='text-red-700 text-xl font-bold mb-4'>Authorization/Data Error! 🛑</p>
            <p className='text-gray-700 text-center mb-6'>{authError}</p>
            <button
                onClick={handleLogout}
                className='flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition'
            >
                <LogIn size={18} /> Logout and Try Again
            </button>
        </div>
    );
    // ----------------------------


    return (
        <div className='flex min-h-screen'>
            {/* 0. Mobile Sidebar Toggle Icon (UNCHANGED) */}
            <div className='sm:hidden fixed top-0 left-0 h-full w-[25px] bg-[#2c3e50] flex items-start justify-center pt-4 z-50 shadow-lg cursor-pointer'
                 onClick={() => setIsSidebarOpen(true)}>
                <Menu size={20} className='text-white' />
            </div>

            {/* 1. Sidebar (Fixed Left) (UNCHANGED) */}
            <div className={`
                ${isSidebarOpen ? 'fixed w-full h-full' : 'hidden'} 
                sm:flex sm:w-64 sm:relative 
                bg-[#ffffff] text-white flex-col sm:h-screen sm:sticky top-0 left-0 pt-6 shadow-2xl z-40 transition-all duration-300 ease-in-out
            `}>
                {isSidebarOpen && (
                    <button 
                        className="absolute top-4 right-4 z-50 p-1 rounded-full bg-red-500 text-white"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                )}
                
                <div className='w-64 bg-[#ffffff] text-white flex flex-col h-screen sm:sticky top-0 left-0 pt-6 shadow-2xl z-10'>
                    <div className='p-4 mb-4 border-b border-[#d9dde0]'>
                        <img src="/FrontLogo.jpg" alt="Raihan Logo" className="w-43 h-26 mb-2 mx-auto"/>
                        <h1 className='text-2xl font-extrabold text-[#7d8181]'>Robi Science</h1>
                    </div>

                    <div className='p-4 space-y-3'>
                        <Link href="/form"className='flex hover:scale-103 items-center gap-3 bg-blue-500 hover:bg-blue-600 transition duration-150 text-white font-semibold py-2 px-4 rounded-md shadow-md w-full' >
                            <Plus size={20} />
                            <span className='text-lg '> Add</span>
                        </Link>

                        <button className='flex items-center gap-3 hover:scale-103 bg-[#14ec14] hover:bg-[#07d634] transition duration-150 text-white font-semibold py-2 px-4 rounded-lg w-full'>
                            <Bell size={20} />
                            <span className='text-lg'>Notice</span>

                        </button>
                    </div>

                    <nav className='flex-1 p-4 mt-6'>
                        <ul className='space-y-2'>
                            <li>
                                <Link href="/" className='flex items-center p-2 rounded-lg text-gray-200 bg-[#2c3e50] font-bold transition duration-150' >
                                    Students List
                                </Link>
                            </li>
                        </ul>
                    </nav>
                    
                    {/* --- LOGOUT BUTTON (UNCHANGED) --- */}
                    <div className='p-4 mt-auto border-t border-[#d9dde0]'>
                        <button
                            onClick={handleLogout}
                            className='flex items-center gap-3 bg-red-500 hover:bg-red-600 transition duration-150 text-white font-semibold py-2 px-4 rounded-md shadow-md w-full'
                        >
                            <LogIn size={20} />
                            <span className='text-lg'>Logout</span>
                        </button>
                    </div>
                    {/* -------------------------------- */}

                </div>
            </div>

            {/* 2. Main Content Area (UNCHANGED) */}
            <main className='flex-1 p-6 bg-gray-50 font-sans ml-[25px] sm:ml-0'>
                <h1 className='text-3xl font-extrabold text-[#2c3e50] mb-6 border-b pb-2'>Students Data Base</h1>
                <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                    <h2 className='text-xl font-semibold mb-3 text-gray-700'>Filter and Search</h2>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="flex-1 border text-[#0e0e13] placeholder:text-[#404440] border-gray-300 shadow-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:text-[#555050] transition duration-150"
                        />
                        <button
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-150 shadow-md"
                            onClick={handleApplyFilters}
                        >
                            <Search size={18} /> Search & Apply
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <input type="text" name="className" placeholder="Class" value={filterInputs.className} onChange={handleFilterInputChange} className="border border-gray-300 text-[#080808] placeholder:text-[#080808] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150" />
                        <select name="batchType" value={filterInputs.batchType} onChange={handleFilterInputChange} className="border border-gray-300 text-[#080808] placeholder:text-[#080808] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150 bg-white">
                            <option value="">Batch Type</option>
                            <option value="class">Class</option>
                            <option value="exam">Exam</option>
                            <option value="both">Both</option>
                        </select>
                        <input type="text" name="batchTime" placeholder="Batch Time" value={filterInputs.batchTime} onChange={handleFilterInputChange} className="border text-[#080808] placeholder:text-[#080808] border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150" />
                        <select name="paymentStatus" value={filterInputs.paymentStatus} onChange={handleFilterInputChange} className="border text-[#080808] placeholder:text-[#080808] border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150 bg-white">
                            <option value="">Payment Status</option>
                            <option value="due">Due</option>
                            <option value="paid">Paid</option>
                        </select>
                        <select name="course" value={filterInputs.course} onChange={handleFilterInputChange} className="border text-[#080808] placeholder:text-[#080808] border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150 bg-white">
                            <option value="">Course Type</option>
                            <option value="monthly">Monthly</option>
                            <option value="6month">6 Month</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <select name="subject" value={filterInputs.subject} onChange={handleFilterInputChange} className="border text-[#080808] placeholder:text-[#080808] rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-150 bg-white">
                            <option value="">Subject</option>
                            <option value="Math">Math</option>
                            <option value="Higher-Math">Higher Math</option>
                            <option value="All">All</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center mb-4 gap-2 text-gray-700">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className='font-medium'>Select All ({filteredStudents.length} students shown)</span>
                </div>

                {/* Student List */}
                <div className='space-y-4'>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                            <div 
                                key={student.id} 
                                onClick={() => handleOpenProfileSidebar(student)}
                                className='bg-white p-4 rounded-xl shadow-lg flex items-center transition duration-200 hover:shadow-xl border border-gray-200 relative cursor-pointer hover:bg-blue-50'
                            >

                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={(e) => { e.stopPropagation(); toggleSelectStudent(student.id); }}
                                    onClick={(e) => e.stopPropagation()} 
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0 mr-4"
                                />

                                <div className='flex items-center justify-center shadow-md w-12 h-12 rounded-full bg-blue-100 text-blue-600 shadow-[#b9b3b3a4] shrink-0 mr-4 overflow-hidden'>
                                    <img src='/profileOne.jpg' alt='profile' className='w-full rounded-full h-full object-cover' />
                                </div>

                                <div className='flex-1 min-w-0'>
                                    <h2 className='text-lg font-bold text-[#2c3e50] truncate' title={student.studentName}>{student.studentName}</h2>
                                    <p className='text-sm text-gray-600'>Class:{student.className}</p>
                                </div>

                                <div className='flex flex-col items-end space-y-1 ml-4 shrink-0'>
                                    {getPaymentBadge(student.due)}
                                    {getCourseBadge(student.paymentType)}
                                    <span className='bg-[#3b19fdbd] text-[12px] text-[#ffffff] font-bold rounded-md px-2 ml-2'>{student.batchType}</span>
                                </div>

                            </div>
                        ))
                    ) : (
                        <p className='text-center text-gray-500 mt-10'>No students found matching the criteria.</p>
                    )}
                </div>
            </main>

            {/* 3. Student Profile Sidebar (UNCHANGED) */}
            <StudentProfileSidebar 
                student={selectedStudentData} 
                isOpen={isProfileSidebarOpen} 
                onClose={handleCloseProfileSidebar} 
                onDataUpdate={fetchStudents} 
            />
            {/* ---------------------------------------------------- */}

        </div>
    );
}