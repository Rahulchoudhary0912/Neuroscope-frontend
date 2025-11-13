import React, { useState } from 'react';
import { predictSegmentation, predictTumorType } from '../services/api';
import { useApi } from '../hooks/useApi';

function ImageUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [predictionType, setPredictionType] = useState('segmentation');

    const segmentApi = useApi(predictSegmentation);
    const classifyApi = useApi(predictTumorType);

    const activeApi = predictionType === 'segmentation' ? segmentApi : classifyApi;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        
        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            alert('Please select an image to upload.');
            return;
        }

        try {
            const result = await activeApi.execute(selectedFile);
            console.log('✅ Prediction result:', result);
        } catch (err) {
            console.error('❌ Prediction failed:', err.message);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setPreview(null);
        segmentApi.reset();
        classifyApi.reset();
    };

    return (
        <div className="upload-container">
            <h2>🧠 Brain MRI Analysis</h2>
            <p>Upload an MRI image for segmentation or tumor classification</p>

            <form onSubmit={handleSubmit}>
                {/* File Input */}
                <div className="file-input-area">
                    {!preview ? (
                        <label htmlFor="file-input" className="file-label">
                            <div className="upload-icon">📁</div>
                            <p>Click to select an MRI image</p>
                            <small>(JPG, PNG, TIF - Max 10MB)</small>
                        </label>
                    ) : (
                        <div className="preview-area">
                            <img src={preview} alt="Preview" className="preview-image" />
                            <button type="button" onClick={handleClear} className="clear-btn">
                                ✕ Clear
                            </button>
                        </div>
                    )}
                    <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Prediction Type Selection */}
                <div className="prediction-type">
                    <label>
                        <input
                            type="radio"
                            value="segmentation"
                            checked={predictionType === 'segmentation'}
                            onChange={(e) => setPredictionType(e.target.value)}
                        />
                        Segmentation (identify tumor region)
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="classification"
                            checked={predictionType === 'classification'}
                            onChange={(e) => setPredictionType(e.target.value)}
                        />
                        Classification (tumor type)
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!selectedFile || activeApi.loading}
                    className="submit-btn"
                >
                    {activeApi.loading ? (
                        <>🔄 Processing...</>
                    ) : (
                        <>
                            {predictionType === 'segmentation' ? '🔍 Segment' : '📊 Classify'}
                        </>
                    )}
                </button>
            </form>

            {/* Results */}
            {activeApi.error && (
                <div className="error-message">
                    <strong>❌ Error:</strong> {activeApi.error}
                </div>
            )}

            {activeApi.data && (
                <div className="results">
                    <h3>Results</h3>
                    {predictionType === 'segmentation' && (
                        <div>
                            <p><strong>Confidence:</strong> {(activeApi.data.confidence * 100).toFixed(2)}%</p>
                            {activeApi.data?.mask_image_url && (
                                <>
                                    <p><strong>Segmentation Mask:</strong></p>
                                    <img
                                        src={activeApi.data.mask_image_url}
                                        alt="Segmented Tumor"
                                        style={{ width: "300px", borderRadius: "10px" }}
                                    />
                                </>
                            )}
                        </div>
                    )}
                    {predictionType === 'classification' && (
                        <div>
                            <p><strong>Tumor Type:</strong> {activeApi.data.predicted_type}</p>
                            <p><strong>Confidence:</strong> {(activeApi.data.confidence * 100).toFixed(2)}%</p>
                            {activeApi.data.probabilities && (
                                <div>
                                    <p><strong>Probabilities:</strong></p>
                                    <ul>
                                        {Object.entries(activeApi.data.probabilities).map(([type, prob]) => (
                                            <li key={type}>
                                                {type}: {(prob * 100).toFixed(2)}%
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ImageUpload;