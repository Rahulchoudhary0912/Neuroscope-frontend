import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import { predictSegmentation, predictTumorType } from '../services/api';
import '../styles/home.css';

const Home = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    setUploadedFile(file);
    
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

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    setAnalysisData(null);

    try {
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
        const API_BASE = process.env.REACT_APP_API_URL || 'http://192.168.213.1:5000';
        segmentedImageUrl = `${API_BASE}${segmentationResult.mask_image_path}`;
      }

      // Combine results
      const combinedData = {
        ...segmentationResult,
        tumor_type: tumorTypeResult.predicted_type || segmentationResult.tumor_type,
        confidence: tumorTypeResult.confidence || segmentationResult.confidence,
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

