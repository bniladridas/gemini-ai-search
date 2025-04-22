# AI Search with Gemini API

This application provides a clean, minimal interface for searching and getting responses from Google's Gemini API, along with information about gem installation and algorithm problems.

## Setup Instructions

1. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

2. **Set up your API key**:
   - Get a Gemini API key from Google AI Studio (https://ai.google.dev/)
   - Add your API key to the `.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

3. **Run the application**:
   ```
   python app.py
   ```

4. **Access the application**:
   Open your browser and go to `http://127.0.0.1:5001`

## Deploying to Vercel

1. **Install Vercel CLI**:
   ```
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```
   vercel login
   ```

3. **Deploy the application**:
   ```
   cd web
   vercel
   ```

4. **Set environment variables on Vercel**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add `GEMINI_API_KEY` with your API key

5. **Redeploy if needed**:
   ```
   vercel --prod
   ```

## Features

- Clean, minimal interface with harmonious typography
- Gem installation guide
- Algorithm problems and solutions
- AI search functionality using Google's Gemini 2.5 Flash Preview model
- Markdown support for formatted responses
- Mobile-friendly responsive design

## How It Works

1. The frontend sends your prompt to the Flask backend
2. The backend calls the Gemini API with your prompt
3. The response is returned and rendered as markdown in the browser

## Python Code

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

## Copyright

© 2025 Niladri Das. All rights reserved. Using this template or any part of this design is strictly prohibited without direct permission from the author.
