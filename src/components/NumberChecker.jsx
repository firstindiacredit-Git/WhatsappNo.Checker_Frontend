import axios from "axios";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

const API_BASE_URL = "http://localhost:5000";

// कंपनी लोगो URL - इसे अपने लोगो के URL से बदलें
const COMPANY_LOGO = "https://crm.pizeonfly.com/Images/pizeonflylogo.png"; // अपने लोगो का URL यहाँ डालें

const NumberChecker = () => {
    const [numbers, setNumbers] = useState("");
    const [results, setResults] = useState([]); // सुनिश्चित करें कि यह एक खाली array है
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState("unknown");
    const [fileUploadError, setFileUploadError] = useState(null);

    // सर्वर स्टेटस चेक करें
    const checkServerStatus = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/whatsapp/status`);
            if (response.data.success) {
                setServerStatus(response.data.connected ? "connected" : "disconnected");
                setError(null);
            }
        } catch (err) {
            setServerStatus("disconnected");
            setError("Cannot connect to server. Please make sure the server is running.");
        }
    };

    // कंपोनेंट माउंट होने पर सर्वर स्टेटस चेक करें
    useEffect(() => {
        checkServerStatus();
        const interval = setInterval(checkServerStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    // Excel फ़ाइल से नंबर निकालने का फंक्शन
    const extractNumbersFromExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // पहली शीट का नाम प्राप्त करें
                    const firstSheetName = workbook.SheetNames[0];
                    // पहली शीट प्राप्त करें
                    const worksheet = workbook.Sheets[firstSheetName];

                    // शीट को JSON में परिवर्तित करें
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // सभी संभावित फोन नंबर्स निकालें
                    let extractedNumbers = [];

                    jsonData.forEach(row => {
                        if (Array.isArray(row)) {
                            row.forEach(cell => {
                                // सेल को स्ट्रिंग में परिवर्तित करें और फोन नंबर खोजें
                                const cellStr = String(cell);

                                // यदि यह नंबर है या नंबर जैसा दिखता है
                                if (/\d{10,}/.test(cellStr)) {
                                    // विशेष वर्णों को हटाएं और नंबर को शुद्ध करें
                                    const cleanedNumber = cellStr.replace(/[^\d]/g, '');
                                    if (cleanedNumber.length >= 10) {
                                        extractedNumbers.push(cleanedNumber);
                                    }
                                }
                            });
                        }
                    });

                    // केवल पहले 10 नंबर ही भेजें
                    resolve(extractedNumbers.slice(0, 10));
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    };

    // फ़ाइल अपलोड हैंडलर
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        setFileUploadError(null);

        if (!file) return;

        // फ़ाइल टाइप चेक करें
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
            setFileUploadError("कृपया केवल Excel या CSV फ़ाइल अपलोड करें");
            return;
        }

        try {
            setLoading(true);
            const extractedNumbers = await extractNumbersFromExcel(file);

            if (extractedNumbers.length === 0) {
                setFileUploadError("फ़ाइल में कोई वैध नंबर नहीं मिला");
                setLoading(false);
                return;
            }

            // नंबर्स को इनपुट फील्ड में सेट करें
            setNumbers(extractedNumbers.join(', '));
            setLoading(false);

        } catch (err) {
            console.error("Excel फ़ाइल पार्स करने में त्रुटि:", err);
            setFileUploadError("फ़ाइल को पार्स करने में त्रुटि। कृपया सही फॉर्मैट वाली फ़ाइल अपलोड करें।");
            setLoading(false);
        }
    };

    const checkNumbers = async () => {
        if (!numbers.trim()) {
            setError("Please enter at least one number");
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]); // रिक्वेस्ट से पहले results को खाली करें

        try {
            const numbersToCheck = numbers.split(",")
                .map(num => num.trim())
                .filter(num => num.length > 0);

            console.log("Checking numbers:", numbersToCheck);

            const response = await axios.post(`${API_BASE_URL}/api/whatsapp/check`, {
                numbers: numbersToCheck,
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            console.log("Response received:", response.data);

            // कंसोल पर response की ज़्यादा जानकारी लॉग करें
            console.log("Response type:", typeof response.data);
            console.log("Has results?", response.data.hasOwnProperty('results'));
            console.log("Results type:", response.data.results ? typeof response.data.results : 'N/A');

            // सावधानीपूर्वक results को सेट करें
            if (response.data && response.data.results && Array.isArray(response.data.results)) {
                setResults(response.data.results);
            } else if (Array.isArray(response.data)) {
                // अगर response.data ही एक array है
                setResults(response.data);
            } else {
                console.error("Unexpected response format:", response.data);
                setResults([]);
                setError("Invalid response format from server");
            }
        } catch (err) {
            console.error("❌ Error checking numbers", err);

            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
                setError("Unable to connect to server. Please check if the backend is running.");
                setServerStatus("disconnected");
            } else if (err.response) {
                setError(`Server error: ${err.response.data.error || 'Unknown error'}`);
            } else {
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // CSV डाउनलोड करने के लिए फंक्शन
    const downloadCSV = () => {
        if (!results.length) return;

        // CSV हेडर
        let csvContent = "Number,Status\n";

        // प्रत्येक रिजल्ट को CSV लाइन में कनवर्ट करें
        results.forEach(result => {
            const number = result.number || result.formattedNumber;
            const status = result.isOnWhatsApp ? "Available" : "Not Available";
            csvContent += `${number},${status}\n`;
        });

        // डाउनलोड करने के लिए ब्लॉब बनाएँ
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        // डाउनलोड लिंक बनाएँ और क्लिक करें
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "whatsapp_numbers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-2 sm:p-4 bg-gray-50">
            {/* Header Section */}
            <div className="w-full max-w-5xl mb-2 sm:mb-4 text-center px-2">
                {/* Company Logo and Name */}
                <div className="flex items-center justify-center mb-2">
                    {/* <img src={COMPANY_LOGO} alt="Company Logo" className="h-8 sm:h-10 mr-2" /> */}
                    <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800">
                        WhatsApp Number Checker
                    </h1>
                </div>
                
                {/* Tagline */}
                <p className="text-gray-600 max-w-4xl mx-auto text-xs sm:text-sm mb-2 sm:mb-4">
                    Instantly verify if phone numbers are registered on WhatsApp. Upload Excel files or enter numbers manually to check availability.
                </p>
                
                {/* Server Status Badge */}
                <div className="inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded-full bg-gray-50 border border-gray-200 shadow-sm">
                    <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
                        serverStatus === "connected" ? "bg-green-500 animate-pulse" : 
                        serverStatus === "disconnected" ? "bg-red-500" : "bg-yellow-500"
                    }`}></div>
                    <span className="text-xs font-medium text-gray-700">
                        {serverStatus === "connected" ? "Server Online" : 
                        serverStatus === "disconnected" ? "Server Offline" : "Connecting..."}
                    </span>
                </div>
            </div>
            
            <div className="w-full max-w-5xl relative">
                {/* Main Content */}
                <div className="relative">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left Column - Input Form */}
                        <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <label htmlFor="numbers" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enter Phone Numbers</label>
                                <input
                                    id="numbers"
                                    type="text"
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                                    placeholder="Enter numbers separated by commas (max 10)"
                                    value={numbers}
                                    onChange={(e) => {
                                        const input = e.target.value;
                                        const numbersArray = input.split(',').map(n => n.trim()).filter(n => n);
                                        if (numbersArray.length <= 10) {
                                            setNumbers(input);
                                        } else {
                                            // Only keep the first 10 numbers
                                            setNumbers(numbersArray.slice(0, 10).join(', '));
                                        }
                                    }}
                                />
                                <div className="flex justify-between mt-1 sm:mt-2">
                                    <p className="text-xs text-gray-500">Example: 919876543210, 918765432109</p>
                                    <p className="text-xs font-medium text-indigo-600">
                                        {numbers ? numbers.split(',').filter(n => n.trim()).length : 0}/10 numbers
                                    </p>
                                </div>
                            </div>
                            
                            {/* Excel File Upload Section */}
                            <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <p className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Upload Excel or CSV File</p>
                                <label 
                                    htmlFor="excel-upload" 
                                    className="flex items-center justify-center w-full p-2 sm:p-3 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-all bg-blue-50 bg-opacity-70"
                                >
                                    <div className="flex flex-col items-center justify-center py-2 sm:py-3">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                        </svg>
                                        <p className="text-xs font-medium text-indigo-700">Drop your file here or click to browse</p>
                                        <p className="text-xs text-gray-500 mt-1">(.xlsx, .xls, .csv)</p>
                                    </div>
                                    <input 
                                        id="excel-upload" 
                                        type="file" 
                                        accept=".xlsx,.xls,.csv" 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                </label>
                                {fileUploadError && (
                                    <p className="mt-1 sm:mt-2 text-xs text-red-600">{fileUploadError}</p>
                                )}
                            </div>

                            <button
                                className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01] shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center text-sm"
                                onClick={checkNumbers}
                                disabled={loading || serverStatus !== "connected"}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        </svg>
                                        Verify WhatsApp Numbers
                                    </>
                                )}
                            </button>

                            {error && <div className="p-2 sm:p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 shadow-sm">{error}</div>}
                        </div>

                        {/* Right Column - Results */}
                        <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all mt-3 lg:mt-0">
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <h3 className="text-sm sm:text-md font-semibold text-gray-800 flex items-center">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Results
                                </h3>
                                
                                {results.length > 0 && (
                                    <button
                                        onClick={downloadCSV}
                                        className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center shadow-sm"
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                        </svg>
                                        Download CSV
                                    </button>
                                )}
                            </div>
                            
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-32 sm:h-48">
                                    <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 mb-2 sm:mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-indigo-600 font-medium text-xs sm:text-sm">Checking WhatsApp numbers...</p>
                                    <p className="text-gray-500 text-xs mt-1">This may take a moment</p>
                                </div>
                            )}
                            
                            {!loading && Array.isArray(results) && results.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-56 sm:h-64 md:h-72 lg:h-80">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 sm:px-3 py-2 border-b border-gray-200 sticky top-0 z-10">
                                        <div className="flex justify-between text-xs font-medium text-gray-700">
                                            <span>Phone Number</span>
                                            <span>Status</span>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-grow">
                                        <ul className="divide-y divide-gray-200">
                                            {results.map((res, index) => (
                                                <li key={index} className="flex justify-between p-2 sm:p-3 hover:bg-gray-50 transition-all">
                                                    <span className="font-medium text-gray-800 text-xs sm:text-sm">{res.number || res.formattedNumber}</span>
                                                    {res.isOnWhatsApp ? (
                                                        <span className="text-green-600 font-medium flex items-center px-2 py-1 bg-green-50 rounded-full text-xs">
                                                            <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                                            </svg>
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium flex items-center px-2 py-1 bg-red-50 rounded-full text-xs">
                                                            <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                                            </svg>
                                                            Not Available
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            
                            {!loading && Array.isArray(results) && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-56 sm:h-64 md:h-72 lg:h-80 bg-white rounded-lg border border-gray-200">
                                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <p className="text-gray-700 font-medium text-xs sm:text-sm">No results to display</p>
                                    <p className="text-xs text-gray-500 mt-1 text-center px-4">Enter phone numbers or upload an Excel file to check WhatsApp availability</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="text-center w-full max-w-5xl mt-3 sm:mt-4 py-2 px-2 sm:px-4">
                <div className="text-xs text-gray-600 font-bold mb-1">DISCLAIMER: We are not responsible if your WhatsApp account gets banned while using this service. Use at your own risk.</div>
                <p className="text-xs text-gray-600">
                    Powered by <span className="font-semibold">Pizeonfly</span>
                </p>
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} WhatsApp Number Checker | All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default NumberChecker;