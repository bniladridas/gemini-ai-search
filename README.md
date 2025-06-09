# AI Search with Gemini API

This application provides a clean, minimal interface for searching and getting responses from Google's Gemini API, with a theme focused on Media Relations and Product Communications.

## Setup Instructions

1. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   pip install gTTS          # For text-to-speech functionality
   pip install google-genai  # For image generation functionality
   ```

2. **Set up your API key**:

   Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
   Add your API key to the `.env` file:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the application**:

   ```bash
   flask run
   ```

4. **Access the application**:
   Open your browser and go to `http://127.0.0.1:5000`

## Deploying to Vercel

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy the application**:

   ```bash
   cd web
   vercel
   ```

4. **Set environment variables on Vercel**:

   * Go to your Vercel dashboard
   * Select your project
   * Go to Settings > Environment Variables
   * Add `GEMINI_API_KEY` with your API key

5. **Redeploy if needed**:

   ```bash
   vercel --prod
   ```

## Features

* Clean, minimal interface with harmonious typography
* AI search functionality using Google's Gemini 2.5 Flash Preview model
* Text-to-speech synthesis for AI responses
* AI image generation using Gemini 2.0 Flash
* Markdown support for formatted responses
* Mobile-friendly responsive design
* Comprehensive Privacy Policy and Terms of Service

## How It Works

### Text Generation

1. The frontend sends your prompt to the Flask backend
2. The backend calls the Gemini API with your prompt
3. The response is returned and rendered as markdown in the browser
4. Optionally, you can click the "Listen" button to convert the response to speech
5. The text is sent to the server, converted to an MP3 file using Google's Text-to-Speech (gTTS), and played back in the browser

### Image Generation

1. Enter a description of the image you want to create
2. The frontend sends your prompt to the Flask backend
3. The backend calls the Gemini API with your prompt using the image generation model
4. The generated image is returned and displayed in the browser

## Additional Testing Notes

* Error case testing for missing or invalid inputs is recommended, e.g.:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{}' http://127.0.0.1:5000/api/generate
  ```

  Expected output:

  ```json
  {
    "error": "No prompt provided"
  }
  ```

* Frontend testing should be considered for UI/UX validation.

## Python Code

### Gemini API Integration

The application uses the following Python code to interact with the Gemini API:

```python
import os
import google.generativeai as genai

# Configure the API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Create a model instance with the newer model
model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')

# Generate content
response = model.generate_content("Your prompt here")

# Print the response
print(response.text)
```

### Text-to-Speech Integration

The application uses Google's Text-to-Speech (gTTS) library to convert AI responses to speech:

```python
from gtts import gTTS
import os
import uuid
import tempfile

# Create a directory for temporary audio files
TEMP_AUDIO_DIR = os.path.join(tempfile.gettempdir(), 'gemini_tts')
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

# Convert text to speech
def text_to_speech(text):
    # Generate a unique filename
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(TEMP_AUDIO_DIR, filename)

    # Convert text to speech
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(filepath)

    return filepath
```