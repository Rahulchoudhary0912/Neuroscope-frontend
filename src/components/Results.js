
function Results({ prediction }) {
    return (
        <div className="results">
            <h2>Prediction Results</h2>
            {prediction ? (
                <div>
                    <p>Prediction Shape: {prediction.prediction_shape}</p>
                    <p>Message: {prediction.message}</p>
                </div>
            ) : (
                <p>No prediction available.</p>
            )}
        </div>
    );
}

export default Results;