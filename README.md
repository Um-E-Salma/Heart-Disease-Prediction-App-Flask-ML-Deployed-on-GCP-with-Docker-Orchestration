# 🫀 Heart Disease Prediction App

**AI-powered Heart Disease Risk Assessment Tool**

A Flask-based web application that uses machine learning to predict heart disease risk based on patient health parameters. The app provides real-time predictions, risk analysis, and interactive visualizations to help healthcare professionals and individuals assess cardiovascular health risks.

## Features

- **Single Patient Prediction**: Get instant heart disease risk assessment
- **Batch Processing**: Analyze multiple patients simultaneously
- **Risk Visualization**: Generate charts showing risk distribution
- **Feature Importance**: Understand which factors most influence predictions
- **RESTful API**: Easy integration with other healthcare systems
- **CORS Support**: Frontend-friendly for web applications

## Health Parameters Used

The model analyzes these 11 key health indicators:
- Age
- Sex
- Chest Pain Type
- Resting Blood Pressure
- Cholesterol Level
- Fasting Blood Sugar
- Resting ECG Results
- Maximum Heart Rate
- Exercise-Induced Angina
- ST Depression (Oldpeak)
- ST Slope

## For Quick Start

### Prerequisites
```bash
pip install flask flask-cors matplotlib seaborn numpy pandas scikit-learn
```

### Installation & Setup
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd heart-disease-app
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Add your trained model**
   - Place your trained model file as `rf_model.pkl` in the root directory
   - Model should be compatible with scikit-learn

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the API**
   - Server runs on: `http://localhost:5001`
   - Health check: `http://localhost:5001/health`

## API Endpoints

### Basic Endpoints
- `GET /` - Welcome message and status
- `GET /health` - Health check endpoint
- `GET /model_info` - Model information and features

### Prediction Endpoints
- `POST /predict` - Single patient prediction
- `POST /predict_batch` - Multiple patients prediction

### Visualization Endpoints
- `POST /generate_risk_chart` - Generate risk distribution chart
- `GET /generate_feature_importance` - Model feature importance chart

## Usage Examples

### Single Patient Prediction
```python
import requests

patient_data = {
    "patient_data": {
        "Age": 54,
        "Sex": 1,
        "ChestPainType": 2,
        "RestingBP": 140,
        "Cholesterol": 200,
        "FastingBS": 0,
        "RestingECG": 0,
        "MaxHR": 162,
        "ExerciseAngina": 0,
        "Oldpeak": 1.0,
        "ST_Slope": 1
    }
}

response = requests.post('http://localhost:5001/predict', json=patient_data)
print(response.json())
```

### Expected Response
```json
{
    "prediction": 1,
    "risk_level": "High Risk",
    "message": "Based on the provided data, you may have a higher risk of heart disease. Please consult with a healthcare professional.",
    "confidence": {
        "low_risk": 25.4,
        "high_risk": 74.6
    }
}
```

## Technical Stack

- **Backend**: Flask (Python)
- **ML Framework**: scikit-learn
- **Visualization**: Matplotlib, Seaborn
- **Data Processing**: Pandas, NumPy
- **API**: RESTful with CORS support

## Project Structure
```
heart-disease-app/
├── app.py              # Main Flask application
├── rf_model.pkl        # Trained ML model (you need to add this)
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── static/            # Static files (optional)
```

## Important Notes

1. **Medical Disclaimer**: This app is for educational and research purposes only. Always consult healthcare professionals for medical advice.

2. **Model Requirements**: You need to provide a trained scikit-learn model saved as `rf_model.pkl`

3. **Data Privacy**: Ensure patient data is handled according to healthcare privacy regulations (HIPAA, GDPR, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source. Please ensure compliance with medical data regulations in your jurisdiction.

## Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify your model file is properly formatted
3. Ensure all dependencies are installed
4. Review the API documentation above

---

**Made with ❤️ by Um-E-Salma for better healthcare through AI**