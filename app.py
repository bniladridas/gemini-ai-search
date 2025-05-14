from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import os
import uuid
import tempfile
import base64
import mimetypes
from dotenv import load_dotenv
import google.generativeai as genai
from gtts import gTTS
from google import genai as google_genai
from google.genai import types

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

# Create directories for temporary files
TEMP_AUDIO_DIR = os.path.join(tempfile.gettempdir(), 'gemini_tts')
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

TEMP_IMAGE_DIR = os.path.join(tempfile.gettempdir(), 'gemini_images')
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        # Get the text from the request
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Generate a unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(TEMP_AUDIO_DIR, filename)

        # Convert text to speech
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(filepath)

        # Return the audio file
        return send_file(filepath, mimetype='audio/mp3', as_attachment=True, download_name=filename)

    except Exception as e:
        print("Exception in text_to_speech:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        # Get the prompt from the request
        data = request.json
        prompt = data.get('prompt', '')

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Import asyncio for event loop handling
        import asyncio

        # Function to run in the event loop
        async def generate_image_async():
            # Initialize the Google Genai client
            client = google_genai.Client(
                api_key=os.environ.get("GEMINI_API_KEY"),
            )

            # Set up the model and content
            model = "gemini-2.0-flash-exp-image-generation"
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=f"Generate an image of: {prompt}"),
                    ],
                ),
            ]

            # Configure the generation parameters
            generate_content_config = types.GenerateContentConfig(
                response_modalities=[
                    "image",
                    "text",
                ],
                response_mime_type="text/plain",
            )

            # Generate the image
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config,
            )

            return response

        # Create a new event loop and run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(generate_image_async())
        loop.close()

        # Process the response
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            has_image = False
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    has_image = True
                    # Generate a unique filename
                    file_extension = mimetypes.guess_extension(part.inline_data.mime_type)
                    filename = f"{uuid.uuid4()}{file_extension}"
                    filepath = os.path.join(TEMP_IMAGE_DIR, filename)

                    # Save the image
                    with open(filepath, "wb") as f:
                        f.write(part.inline_data.data)

                    # Return the image file
                    return send_file(filepath, mimetype=part.inline_data.mime_type)

            # If we processed all parts and didn't find an image
            if not has_image:
                # Check if there's text in the response
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'text') and part.text:
                        # If there's text but no image, return an error with the text
                        return jsonify({'error': f"The model returned text instead of an image: {part.text}"}), 400

        # If no valid response was found
        return jsonify({'error': 'Failed to generate image. The model did not return any image data.'}), 500

    except Exception as e:
        print("Exception in generate_image:", e)
        return jsonify({'error': str(e)}), 500

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

# This is for Vercel serverless deployment
app.debug = False
