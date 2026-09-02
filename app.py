import os
import gc
import joblib
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Model Singleton Cache
MODELS = {
    'diabetes': None,
    'housing': None,
    'ecomm_vectorizer': None,
    'ecomm_clf': None
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_diabetes_model():
    if MODELS['diabetes'] is None:
        path = os.path.join(BASE_DIR, 'Chẩn đoán bệnh tiểu đường', 'diabetes_model_pipeline.joblib')
        if os.path.exists(path):
            MODELS['diabetes'] = joblib.load(path)
    return MODELS['diabetes']

def get_housing_model():
    if MODELS['housing'] is None:
        path = os.path.join(BASE_DIR, 'Dự đoán giá nhà đất', 'housing_model_pipeline.joblib')
        if os.path.exists(path):
            MODELS['housing'] = joblib.load(path)
    return MODELS['housing']

def get_ecomm_model():
    if MODELS['ecomm_vectorizer'] is None or MODELS['ecomm_clf'] is None:
        path = os.path.join(BASE_DIR, 'Phát hiện sở thích của khách hàng trong thương mại điện tử', 'ecomm_model_pipeline.joblib')
        if os.path.exists(path):
            vectorizer, clf = joblib.load(path)
            MODELS['ecomm_vectorizer'] = vectorizer
            MODELS['ecomm_clf'] = clf
    return MODELS['ecomm_vectorizer'], MODELS['ecomm_clf']

# Routes for HTML Pages
@app.route('/')
def home():
    return render_template('index.html', active_page='home')

@app.route('/diabetes')
def diabetes_page():
    return render_template('diabetes.html', active_page='diabetes')

@app.route('/housing')
def housing_page():
    return render_template('housing.html', active_page='housing')

@app.route('/ecomm')
def ecomm_page():
    return render_template('ecomm.html', active_page='ecomm')

# API Endpoints
@app.route('/predict/diabetes', methods=['POST'])
def predict_diabetes():
    try:
        data = request.get_json()
        model = get_diabetes_model()
        
        if model is None:
            return jsonify({'status': 'error', 'message': 'Mô hình tiểu đường không khả dụng.'}), 500

        # Construct DataFrame matching training schema
        df = pd.DataFrame([{
            'gender': str(data.get('gender', 'Female')),
            'age': float(data.get('age', 45)),
            'hypertension': int(data.get('hypertension', 0)),
            'heart_disease': int(data.get('heart_disease', 0)),
            'smoking_history': str(data.get('smoking_history', 'never')),
            'bmi': float(data.get('bmi', 25.0)),
            'HbA1c_level': float(data.get('HbA1c_level', 5.5)),
            'blood_glucose_level': float(data.get('blood_glucose_level', 120))
        }])

        pred = int(model.predict(df)[0])
        prob = float(model.predict_proba(df)[0][1]) if hasattr(model, 'predict_proba') else float(pred)

        gc.collect()

        return jsonify({
            'status': 'success',
            'prediction': pred,
            'probability': prob
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/predict/housing', methods=['POST'])
def predict_housing():
    try:
        data = request.get_json()
        model = get_housing_model()

        if model is None:
            return jsonify({'status': 'error', 'message': 'Mô hình giá nhà không khả dụng.'}), 500

        # Build feature DataFrame matching Vietnam Housing dataset features
        df = pd.DataFrame([{
            'Address': str(data.get('Address', '')),
            'Area': float(data.get('Area', 80.0)),
            'Frontage': float(data.get('Frontage', 5.0)) if data.get('Frontage') else np.nan,
            'Access Road': float(data.get('Access_Road', 10.0)) if data.get('Access_Road') else np.nan,
            'House direction': str(data.get('House_direction', 'Đông - Nam')),
            'Balcony direction': str(data.get('Balcony_direction', 'Đông - Nam')),
            'Floors': float(data.get('Floors', 4)),
            'Bedrooms': float(data.get('Bedrooms', 4)),
            'Bathrooms': float(data.get('Bathrooms', 3)),
            'Legal status': str(data.get('Legal_status', 'Have certificate')),
            'Furniture state': str(data.get('Furniture_state', 'Full'))
        }])

        predicted_price = float(model.predict(df)[0])

        gc.collect()

        return jsonify({
            'status': 'success',
            'price_billion': max(0.1, predicted_price)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/predict/ecomm', methods=['POST'])
def predict_ecomm():
    try:
        data = request.get_json()
        review_text = data.get('review_text', '').strip()

        if not review_text:
            return jsonify({'status': 'error', 'message': 'Vui lòng nhập văn bản đánh giá.'}), 400

        vectorizer, clf = get_ecomm_model()

        if vectorizer is None or clf is None:
            return jsonify({'status': 'error', 'message': 'Mô hình E-commerce không khả dụng.'}), 500

        X_tfidf = vectorizer.transform([review_text])
        pred = int(clf.predict(X_tfidf)[0])
        prob = float(clf.predict_proba(X_tfidf)[0][1]) if hasattr(clf, 'predict_proba') else float(pred)

        gc.collect()

        return jsonify({
            'status': 'success',
            'prediction': pred,
            'probability': prob
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
