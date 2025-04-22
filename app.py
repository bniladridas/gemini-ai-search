from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure the Gemini API with your API key
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# We don't need to set SERVER_NAME as it can cause issues with url_for
# Just ensure the application is accessible at the correct URL

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_response():
    try:
        # Debug print for GEMINI_API_KEY
        print("GEMINI_API_KEY:", os.environ.get("GEMINI_API_KEY"))

        # Get the prompt from the request
        data = request.json
        prompt = data.get('prompt', '')

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Create a GenerativeModel instance with the newer model
        model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')

        # Generate the response
        response = model.generate_content(prompt)

        # Return the response
        return jsonify({'response': response.text})

    except Exception as e:
        print("Exception in generate_response:", e)
        return jsonify({'error': str(e)}), 500

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

# This is for Vercel serverless deployment
app.debug = False
