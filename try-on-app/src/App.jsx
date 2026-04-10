import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';

function App() {
  const [userImage, setUserImage] = useState(null);
  const [userImageBase64, setUserImageBase64] = useState('');
  const [garmentImage, setGarmentImage] = useState(null);
  const [garmentImageBase64, setGarmentImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [productData, setProductData] = useState({ id: 'SKU-DEMO-001', url: '' });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  // Listen for PostMessage from the WordPress Parent Window
  useEffect(() => {
    const handleMessage = (event) => {
      // In production, verify event.origin matches WP site
      if (event.data && event.data.type === 'TRY_ON_INIT') {
        const { garmentId, garmentUrl } = event.data.payload;
        setProductData({ id: garmentId, url: garmentUrl });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUserImage(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
      // Reset previous results
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1
  });

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setUserImage(imageSrc);
      setUserImageBase64(imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  const handleTryOn = async () => {
    if (!userImageBase64 || (!productData.url && !garmentImageBase64)) {
      alert("Please upload both a user photo and a garment image (or use via WordPress).");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userImageBase64,
          garmentUrl: productData.url || garmentImageBase64,
          garmentId: productData.id || 'LOCAL-TEST-SKU'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the Try-On API.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.imageUrl) {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `Virtual_TryOn_${productData.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="tryon-container">
      <div className="glass-panel">
        <div className="header">
          <h1>Virtual Try-On</h1>
          <p>Powered by AI Vision</p>
        </div>

        <div className="workflow-grid">
          {/* Left Column: Upload */}
          <div className="upload-section">
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '0.5rem', background: !isCameraOpen ? '#4f46e5' : '#475569' }}
                onClick={() => setIsCameraOpen(false)}
              >
                File Upload
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '0.5rem', background: isCameraOpen ? '#4f46e5' : '#475569' }}
                onClick={() => setIsCameraOpen(true)}
              >
                📸 Open Camera
              </button>
            </div>

            {isCameraOpen ? (
              <div className="dropzone" style={{ padding: '1rem' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={1}
                  forceScreenshotSourceSize={true}
                  videoConstraints={{
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                  }}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #4f46e5' }}
                />
                <button 
                  className="btn" 
                  style={{ marginTop: '1rem', background: '#ec4899' }}
                  onClick={capturePhoto}
                >
                  Capture High-Res Photo
                </button>
              </div>
            ) : (
              <div 
                {...getRootProps()} 
                className={`dropzone ${isDragActive ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                {userImage ? (
                  <img src={userImage} alt="User Upload" className="image-preview" />
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1rem', color: '#6366f1' }}>
                      <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <h3>1. Drop your full-body photo here</h3>
                  </div>
                )}
              </div>
            )}

            {/* Garment Dropzone (For Local Testing Only) */}
            {!productData.url && (
              <div className="dropzone" style={{ minHeight: '150px' }}>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if(file){
                    setGarmentImage(URL.createObjectURL(file));
                    const reader = new FileReader();
                    reader.onloadend = () => setGarmentImageBase64(reader.result);
                    reader.readAsDataURL(file);
                  }
                }} style={{ display: 'none' }} id="garment-upload" />
                <label htmlFor="garment-upload" style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {garmentImage ? (
                   <img src={garmentImage} alt="Garment" style={{ height: '100px', borderRadius: '8px' }} />
                  ) : (
                   <h3>2. Local Test: Click to select a Garment/Dress image</h3>
                  )}
                </label>
              </div>
            )}

            <button 
              className="btn" 
              onClick={handleTryOn} 
              disabled={(!userImage || (!productData.url && !garmentImage)) || loading}
            >
              {loading ? 'Processing via Gemini...' : 'Generate Try-On'}
            </button>
          </div>

          {/* Right Column: Result */}
          <div className="preview-section">
            {loading ? (
              <div className="result-placeholder">
                <div>
                  <div className="loader"></div>
                  <p>AI is analyzing the outfit...</p>
                </div>
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <img src={result.imageUrl} alt="Result" className="image-preview" style={{ border: '2px solid #ec4899' }} />
                {result.message && (
                  <div className="analysis-text">
                    <strong>AI Analysis:</strong> <br/>
                    {result.message}
                  </div>
                )}
                <button className="btn" style={{ background: '#ec4899' }} onClick={handleDownload}>
                  Download Image
                </button>
              </div>
            ) : (
              <div className="result-placeholder">
                Results will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
