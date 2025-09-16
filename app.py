import matplotlib
matplotlib.use('Agg')  # To use non-interactive backend before importing pyplot

from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import io
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import pickle
import json
import logging
import os

from config import get_config, MedicalConfig


app = Flask(__name__)
CORS(app)  # To Enable CORS for all routes


# Step 2: Load environment-specific config
config_class = get_config()
app.config.from_object(config_class)

# Step 3: Run any extra initialization from config
if hasattr(config_class, "init_app"):
    config_class.init_app(app)


# FOr Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# For Heart disease feature names
FEATURE_NAMES = app.config.get('FEATURE_NAMES', [
    'Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
    'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina',
    'Oldpeak', 'ST_Slope'
])
 
'''FEATURE_NAMES = [
    'Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
    'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina',
    'Oldpeak', 'ST_Slope'
]'''

# For Heart disease risk interpretation
RISK_LEVELS = {
    0: {
        "risk": "Low Risk",
        "message": "Based on the provided data, you have a low risk of heart disease. However, maintain a healthy lifestyle.",
        "color": "#28a745"  # Green
    },
    1: {
        "risk": "High Risk", 
        "message": "Based on the provided data, you may have a higher risk of heart disease. Please consult with a healthcare professional.",
        "color": "#dc3545"  # Red
    }
}
def load_local_model(model_path):
    """Load model from local pickle file."""
    try:
        with open(model_path, 'rb') as file:
            model = pickle.load(file)
        logger.info(f"Model loaded from local file: {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading local model: {e}")
        return None
MODEL_PATH = app.config.get('MODEL_PATH', './rf_model.pkl')

# Load model with config path:
try:
    model = load_local_model(MODEL_PATH)
    if model is None:
        raise Exception("Could not load model from local file")
except Exception as e:
    logger.error(f"Failed to initialize model: {e}")
    model = None

def preprocess_input(data):
    """Preprocess input data for heart disease prediction."""
    try:
        # TO Convert input to DataFrame with proper feature names
        if isinstance(data, dict):
            # For Single prediction
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            # For Multiple predictions
            df = pd.DataFrame(data)
        else:
            raise ValueError("Input data must be dict or list of dicts")
        
        # To Ensure all required features are present
        for feature in FEATURE_NAMES:
            if feature not in df.columns:
                df[feature] = 0  # Default value
        
        # To Reorder columns to match training data
        df = df[FEATURE_NAMES]
        
        logger.info(f"Preprocessed data shape: {df.shape}")
        return df.values
    except Exception as e:
        logger.error(f"Error in preprocessing: {e}")
        raise

def get_recommendations(prediction, patient_data):
    """Generate health recommendations based on prediction and patient data."""
    recommendations = []
    
    if prediction == 1:  # High risk
        recommendations.append("🚨 Consult a cardiologist immediately for comprehensive evaluation")
        recommendations.append("💊 Follow prescribed medications and treatment plans strictly")
        recommendations.append("🏃‍♂️ Start supervised exercise program as recommended by your doctor")
        
    # For Age-based recommendations
    age = patient_data.get('Age', 0)
    if age > 50:
        recommendations.append("🔬 Regular cardiac screenings are essential at your age")
    
    # FOr Cholesterol recommendations
    cholesterol = patient_data.get('Cholesterol', 0)
    if cholesterol > 240:
        recommendations.append("🥗 Adopt a heart-healthy diet low in saturated fats")
    
    # For Blood pressure recommendations  
    bp = patient_data.get('RestingBP', 0)
    if bp > 140:
        recommendations.append("🧘‍♀️ Practice stress management and monitor blood pressure regularly")
    
    # For General recommendations
    recommendations.extend([
        "🚭 Avoid smoking and limit alcohol consumption",
        "⚖️ Maintain a healthy weight through balanced diet and exercise",
        "😴 Ensure adequate sleep (7-9 hours per night)",
        "📱 Use health monitoring apps to track your progress"
    ])
    
    return recommendations

# To Initialize the model
try:
    # To Load from local model file
    model = load_local_model("./rf_model.pkl")
    
    if model is None:
        raise Exception("Could not load model from local file")
        
except Exception as e:
    logger.error(f"Failed to initialize model: {e}")
    model = None

@app.route('/')
def home():
    """Serve the main HTML page."""
    return render_template('index.html')

@app.route('/api')
def api_info():
    """API information endpoint."""
    return jsonify({
        "message": "Heart Disease Prediction API - AI-powered Risk Assessment",
        "version": "1.0.0",
        "status": "active",
        "model_loaded": model is not None,
        "features_count": len(FEATURE_NAMES),
        "description": "Predicts heart disease risk based on 11 key health parameters",
        "endpoints": {
            "/": "Main web interface",
            "/api": "API information",
            "/health": "Health check",
            "/predict": "Single patient prediction",
            "/predict_batch": "Batch prediction",
            "/generate_risk_chart": "Risk distribution chart",
            "/generate_feature_importance": "Feature importance chart",
            "/model_info": "Model information"
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_status": "loaded" if model else "not_loaded",
        "api_endpoints": [
            "/predict", "/predict_batch", "/generate_risk_chart", 
            "/generate_feature_importance", "/model_info"
        ]
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict heart disease risk for a single patient."""
    if model is None:
        return jsonify({"error": "Model not loaded. Please ensure rf_model.pkl exists."}), 500
    
    try:
        data = request.json
        patient_data = data.get('patient_data')
        
        if not patient_data:
            return jsonify({
                "error": "No patient data provided",
                "required_format": {
                    "patient_data": {feature: "numeric_value" for feature in FEATURE_NAMES}
                }
            }), 400

        # To Preprocess the input data
        processed_data = preprocess_input(patient_data)
        
        # To Make prediction
        prediction = model.predict(processed_data)[0]
        prediction_proba = model.predict_proba(processed_data)[0]
        
        # To Get risk information
        risk_info = RISK_LEVELS[prediction]
        
        response = {
            "prediction": int(prediction),
            "risk_level": risk_info["risk"],
            "message": risk_info["message"],
            "confidence": {
                "low_risk": round(float(prediction_proba[0]) * 100, 2),
                "high_risk": round(float(prediction_proba[1]) * 100, 2)
            },
            "input_data": patient_data,
            "recommendations": get_recommendations(prediction, patient_data)
        }
        
        logger.info(f"Prediction made: {prediction} (Risk: {risk_info['risk']})")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """Predict heart disease risk for multiple patients."""
    if model is None:
        return jsonify({"error": "Model not loaded. Please ensure rf_model.pkl exists."}), 500
    
    try:
        data = request.json
        patients_data = data.get('patients_data')
        
        if not patients_data:
            return jsonify({"error": "No patients data provided"}), 400

        # To Preprocess the input data
        processed_data = preprocess_input(patients_data)
        
        # To Make predictions
        predictions = model.predict(processed_data)
        predictions_proba = model.predict_proba(processed_data)
        
        results = []
        for i, (pred, proba) in enumerate(zip(predictions, predictions_proba)):
            risk_info = RISK_LEVELS[pred]
            results.append({
                "patient_id": i + 1,
                "prediction": int(pred),
                "risk_level": risk_info["risk"],
                "message": risk_info["message"],
                "confidence": {
                    "low_risk": round(float(proba[0]) * 100, 2),
                    "high_risk": round(float(proba[1]) * 100, 2)
                }
            })
        
        # To Add summary statistics
        high_risk_count = sum(1 for r in results if r["prediction"] == 1)
        low_risk_count = len(results) - high_risk_count
        
        response = {
            "results": results,
            "summary": {
                "total_patients": len(results),
                "high_risk_count": high_risk_count,
                "low_risk_count": low_risk_count,
                "high_risk_percentage": round((high_risk_count / len(results)) * 100, 2)
            }
        }
        
        logger.info(f"Batch prediction completed for {len(results)} patients")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500

@app.route('/generate_risk_chart', methods=['POST'])
def generate_risk_chart():
    """Generate a risk distribution chart."""
    try:
        data = request.get_json()
        predictions = data.get('predictions')
        
        if not predictions:
            return jsonify({"error": "No predictions provided"}), 400

        # To Count risk levels
        risk_counts = {"Low Risk": 0, "High Risk": 0}
        for pred in predictions:
            if pred == 0:
                risk_counts["Low Risk"] += 1
            else:
                risk_counts["High Risk"] += 1

        # To Generate pie chart
        plt.figure(figsize=(10, 8))
        colors = ['#28a745', '#dc3545']  # Green for low risk, Red for high risk
        
        wedges, texts, autotexts = plt.pie(
            risk_counts.values(),
            labels=risk_counts.keys(),
            colors=colors,
            autopct='%1.1f%%',
            startangle=90,
            textprops={'fontsize': 14, 'fontweight': 'bold'},
            explode=(0.05, 0.05)  # Slightly separate slices
        )
        
        # To Enhance text appearance
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
            autotext.set_fontsize(12)
        
        plt.title('Heart Disease Risk Distribution', 
                 fontsize=18, fontweight='bold', pad=20)
        plt.axis('equal')

        # To Add total count annotation
        total = sum(risk_counts.values())
        plt.figtext(0.5, 0.02, f'Total Patients: {total}', 
                   ha='center', fontsize=12, style='italic')

        # To Save chart to BytesIO
        img_io = io.BytesIO()
        plt.savefig(img_io, format='PNG', bbox_inches='tight', dpi=300, 
                   facecolor='white', edgecolor='none')
        img_io.seek(0)
        plt.close()

        return send_file(img_io, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Chart generation failed: {e}")
        return jsonify({"error": f"Chart generation failed: {str(e)}"}), 500

@app.route('/generate_feature_importance', methods=['POST']) #GET
def generate_feature_importance():
    """Generate feature importance chart."""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # To Get feature importance (assuming RandomForest model)
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            
            # To Create DataFrame for plotting
            feature_df = pd.DataFrame({
                'Feature': FEATURE_NAMES,
                'Importance': importances
            }).sort_values('Importance', ascending=True)
            
            # TO Generate horizontal bar chart
            plt.figure(figsize=(12, 8))
            bars = plt.barh(feature_df['Feature'], feature_df['Importance'], 
                           color='steelblue', alpha=0.8, edgecolor='navy', linewidth=0.5)
            
            # To Add value labels on bars
            for i, bar in enumerate(bars):
                width = bar.get_width()
                plt.text(width + 0.001, bar.get_y() + bar.get_height()/2, 
                        f'{width:.3f}', ha='left', va='center', fontsize=10)
            
            plt.xlabel('Feature Importance', fontsize=14, fontweight='bold')
            plt.ylabel('Health Parameters', fontsize=14, fontweight='bold')
            plt.title('Heart Disease Prediction - Feature Importance Analysis', 
                     fontsize=16, fontweight='bold', pad=20)
            plt.grid(axis='x', alpha=0.3, linestyle='--')
            plt.tight_layout()
            
            # To Save chart to BytesIO
            img_io = io.BytesIO()
            plt.savefig(img_io, format='PNG', bbox_inches='tight', dpi=300,
                       facecolor='white', edgecolor='none')
            img_io.seek(0)
            plt.close()
            
            return send_file(img_io, mimetype='image/png')
        else:
            return jsonify({"error": "Model does not support feature importance"}), 400
            
    except Exception as e:
        logger.error(f"Feature importance chart generation failed: {e}")
        return jsonify({"error": f"Feature importance generation failed: {str(e)}"}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get comprehensive model information."""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        info = {
            "model_type": type(model).__name__,
            "features": FEATURE_NAMES,
            "feature_count": len(FEATURE_NAMES),
            "prediction_classes": {
                "0": "Low Risk - Healthy cardiovascular profile",
                "1": "High Risk - Elevated cardiovascular risk factors"
            },
            "risk_levels": RISK_LEVELS
        }
        
        # To Add model-specific info if available
        if hasattr(model, 'n_estimators'):
            info["n_estimators"] = model.n_estimators
        if hasattr(model, 'max_depth'):
            info["max_depth"] = model.max_depth
        if hasattr(model, 'criterion'):
            info["criterion"] = model.criterion
            
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return jsonify({"error": f"Error getting model info: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "available_endpoints": [
        "/", "/health", "/predict", "/predict_batch", 
        "/generate_risk_chart", "/generate_feature_importance", "/model_info"
    ]}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error", "message": str(error)}), 500

if __name__ == '__main__':
    print("🫀 Heart Disease Prediction API Starting...")
    print("🔗 Server URL: http://localhost:{app.config.get('PORT', 8080)}")
    print("📚 API Documentation: Check README.md")
    print("🏥 Ready to predict heart disease risk!")
    debug_mode = bool(app.config.get('DEBUG_MODE', 0))

    app.run(
        host='0.0.0.0', 
        port=app.config.get('PORT', 8080), 
        debug=debug_mode    #app.config.get['DEBUG_MODE', False]
        )