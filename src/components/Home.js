import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import { predictSegmentation, predictTumorType, verifyBrainMRI, API_BASE_URL } from '../services/api';
import '../styles/home.css';

const Home = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [verifiedFileSignature, setVerifiedFileSignature] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const makeFileSignature = (file) =>
    `${file.name}-${file.size}-${file.lastModified}`;

  const handleFileSelect = (file) => {
    if (!file) return;
    
    setUploadedFile(file);
    setAnalysisData(null);
    setVerification(null);
    setVerificationError(null);
    setVerifiedFileSignature(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('highlight');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('highlight');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('highlight');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const runVerification = async () => {
    if (!uploadedFile) return null;

    setVerifying(true);
    setVerificationError(null);

    try {
      const result = await verifyBrainMRI(uploadedFile);
      const signature = makeFileSignature(uploadedFile);
      const payload = {
        ...result,
        fileSignature: signature,
      };
      setVerification(payload);
      setVerifiedFileSignature(signature);
      return payload;
    } catch (error) {
      const message =
        error.message || "MRI verification failed. Please try again.";
      setVerification(null);
      setVerifiedFileSignature(null);
      setVerificationError(message);
      throw new Error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    if (!uploadedFile || verifying) return;
    try {
      const result = await runVerification();
      if (result && !result.is_brain_mri) {
        setVerificationError(
          "Uploaded image is not classified as a brain MRI. Please upload a valid MRI scan."
        );
      } else {
        setVerificationError(null);
      }
    } catch (error) {
      setVerificationError(error.message);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || verifying) return;

    setLoading(true);
    setAnalysisData(null);

    try {
      const signature = makeFileSignature(uploadedFile);
      let currentVerification = verification;

      if (!currentVerification || verifiedFileSignature !== signature) {
        currentVerification = await runVerification();
      }

      if (!currentVerification?.is_brain_mri) {
        const message =
          "The uploaded scan is not recognized as a brain MRI. Please upload a valid MRI scan for analysis.";
        setVerificationError(message);
        setLoading(false);
        return;
      } else {
        setVerificationError(null);
      }

      // Run both predictions in parallel
      const [segmentationResult, tumorTypeResult] = await Promise.all([
        predictSegmentation(uploadedFile),
        predictTumorType(uploadedFile)
      ]);

      // Determine segmented mask image URL
      let segmentedImageUrl = preview; // fallback to preview
      if (segmentationResult.mask_image_url) {
        segmentedImageUrl = segmentationResult.mask_image_url;
      } else if (segmentationResult.segmented_mask_url) {
        segmentedImageUrl = segmentationResult.segmented_mask_url;
      } else if (segmentationResult.mask_image_path) {
        segmentedImageUrl = `${API_BASE_URL}${segmentationResult.mask_image_path}`;
      }

      // Combine results
      const combinedData = {
        ...segmentationResult,
        tumor_type: tumorTypeResult.predicted_type || segmentationResult.tumor_type,
        confidence: tumorTypeResult.confidence || segmentationResult.confidence,
        verification: {
          is_brain_mri: currentVerification.is_brain_mri,
          confidence: currentVerification.confidence,
        },
        originalImage: preview,
        segmentedImage: segmentedImageUrl
      };

      setAnalysisData(combinedData);
    } catch (error) {
      console.error('Analysis error:', error);
      console.error('Error details:', error.message || error);
      const errorMessage = error.message || 'An error occurred during analysis. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (imageSrc) => {
    setModalImage(imageSrc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  const getStateClass = (state) => {
    if (!state || state === 'None' || state === null) return '';
    const lowerState = String(state).toLowerCase();
    if (lowerState.includes('first')) return 'first-state';
    if (lowerState.includes('intermediate')) return 'intermediate-state';
    if (lowerState.includes('final')) return 'final-state';
    return '';
  };

  return (
    <div className="home-container">
      <Header show3DButton={false} />
      
      <main className="main-content">
        <div className="title-section">
          <div className="title-row">
            <h1 className="title">NeuroScope 2D</h1>
            <Link to="/3d-model" className="model-button">
              <i className="fas fa-cube"></i>
              View 3D Model
            </Link>
          </div>
          <p className="subtitle">Advanced Brain Tumor Detection & Analysis</p>
        </div>
        
        <div 
          className="upload-container" 
          id="dropZone"
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="brain-icon floating" viewBox="0 0 24 24">
            <path fill="currentColor" d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/>
          </svg>
          <p className="upload-text">Drag & Drop or Click to Upload MRI Scan</p>
          {preview && (
            <img 
              src={preview} 
              alt="Upload Preview" 
              className="upload-preview visible"
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {uploadedFile && !loading && (
          <div
            className={`verification-panel visible ${
              verification?.is_brain_mri
                ? 'verified'
                : verification && !verification.is_brain_mri
                ? 'invalid'
                : ''
            }`}
          >
            <div className="verification-content">
              <h3>MRI Verification</h3>
              <p>
                {verifying && 'Verifying MRI scan...'}
                {!verifying && verification?.is_brain_mri && (
                  <>
                    Valid brain MRI detected ({verification.confidence || 0}% confidence)
                  </>
                )}
                {!verifying &&
                  verification &&
                  verification.is_brain_mri === false &&
                  'Uploaded image is not classified as a brain MRI.'}
                {!verifying &&
                  !verification &&
                  !verificationError &&
                  'Verify the image to ensure it is a brain MRI before analysis.'}
              </p>
              {verificationError && (
                <span className="verification-error">{verificationError}</span>
              )}
            </div>
            <button
              type="button"
              className="verify-button"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'Verify MRI'}
            </button>
          </div>
        )}

        {uploadedFile && !loading && (
          <button 
            className="analyze-button visible" 
            onClick={handleAnalyze}
          >
            Analyze Scan
          </button>
        )}

        {loading && (
          <div className="loading-spinner visible"></div>
        )}

        {analysisData && (
          <div className="analysis-section visible">
            <div className="tumor-details">
              <div className="detail-card">
                <h3>Tumor Type</h3>
                <div className="value">
                  {(analysisData.tumor_type || analysisData.predicted_type || 'N/A').toUpperCase()}
                </div>
              </div>
              <div className="detail-card">
                <h3>Tumor Area</h3>
                <div className="value">
                  {analysisData.tumor_area_pixels 
                    ? `${analysisData.tumor_area_pixels.toLocaleString()} px²`
                    : 'N/A'}
                </div>
              </div>
              <div className="detail-card">
                <h3>Confidence</h3>
                <div className="value">
                  {analysisData.confidence 
                    ? `${analysisData.confidence}%`
                    : analysisData.confidence_score
                    ? `${(analysisData.confidence_score * 100).toFixed(2)}%`
                    : 'N/A'}
                </div>
              </div>
              <div className="detail-card">
                <h3>Segmentation Accuracy</h3>
                <div className="value">
                  {analysisData.segmentation_accuracy 
                    ? `${analysisData.segmentation_accuracy}%`
                    : 'N/A'}
                </div>
              </div>
              <div className={`detail-card state-card ${getStateClass(analysisData.state || analysisData.tumor_state)}`}>
                <h3>State Classification</h3>
                <div className="value">
                  {analysisData.state || analysisData.tumor_state || 'No Tumor'}
                </div>
              </div>
            </div>

            <div className="images-container">
              <div className="image-card" onClick={() => openModal(preview)}>
                <h3>
                  Original MRI Scan
                  <span className="zoom-icon"><i className="fas fa-search-plus"></i></span>
                </h3>
                <img src={preview} alt="Original MRI Scan" id="originalImage" />
              </div>
              <div className="image-card" onClick={() => openModal(analysisData.segmentedImage)}>
                <h3>
                  Segmented Tumor
                  <span className="zoom-icon"><i className="fas fa-search-plus"></i></span>
                </h3>
                <img 
                  src={analysisData.segmentedImage || preview} 
                  alt="Segmented Tumor" 
                  id="segmentedImage"
                  onError={(e) => {
                    // If mask image fails to load, show preview instead
                    e.target.src = preview;
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showModal && (
          <div className="modal visible" onClick={closeModal}>
            <span className="modal-close" onClick={closeModal}>&times;</span>
            <img 
              className="modal-content" 
              src={modalImage} 
              alt="Modal view"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

