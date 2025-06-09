// Initialize marked.js for markdown rendering
marked.setOptions({
    breaks: true,
    gfm: true
});

// Unified search handler
function handleUnifiedSearch() {
    const input = document.querySelector('.unified-input');
    const { mode, style } = getSelectedMode();
    const prompt = input.value.trim();

    if (!prompt) {
        showError('Hmm… we’re waiting on your next word. What would you like to ask?');
        return;
    }

    // Clear previous results
    clearResults();

    // Show loading state
    showLoading(mode);

    // Route to appropriate handler based on mode and style
    if (mode === 'text') {
        handleTextGeneration(prompt, style);
    } else if (mode === 'image') {
        handleImageGeneration(prompt);
    }
}

// Clear all result containers
function clearResults() {
    const responseContainer = document.getElementById('response');
    const thinkingContainer = document.getElementById('thinking');
    const imageContainer = document.getElementById('image-container');
    const ttsButton = document.getElementById('tts-button');
    const audioPlayer = document.getElementById('audio-player');

    responseContainer.style.display = 'none';
    thinkingContainer.style.display = 'none';
    imageContainer.style.display = 'none';
    ttsButton.style.display = 'none';
    audioPlayer.style.display = 'none';
    audioPlayer.pause();
    audioPlayer.src = '';
}

// Show loading state
function showLoading(mode) {
    const submitButton = document.getElementById('submit-button');
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    if (mode === 'text') {
        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = '<em id="thinking-text" class="character-by-character">Thinking...</em>';
        animateText(responseContainer.querySelector('#thinking-text'));
        responseContainer.style.display = 'block';
    } else if (mode === 'image') {
        const imageContainer = document.getElementById('image-container');
        const imageMessage = document.getElementById('image-message');
        imageMessage.textContent = 'Generating your image. This may take a minute...';
        imageMessage.style.display = 'block';
        imageContainer.style.display = 'block';
    }
}

// Hide loading state
function hideLoading() {
    const submitButton = document.getElementById('submit-button');
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
}

// Show error message
function showError(message) {
    const responseContainer = document.getElementById('response');
    responseContainer.innerHTML = `<em>Error: ${message}</em>`;
    responseContainer.style.display = 'block';
}

// Handle text generation based on style
function handleTextGeneration(prompt, style) {
    if (style === 'thinking') {
        handleThinkingMode(prompt);
    } else if (style === 'url-context') {
        handleUrlContext(prompt);
    } else {
        handleNormalGeneration(prompt);
    }
}

// Handle normal text generation
function handleNormalGeneration(prompt) {
    fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Hmm… grace takes time. Try again.');
        }
        return response.json();
    })
    .then(data => {
        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = marked.parse(data.response);

        // Show the TTS button if we have a response
        if (data.response && data.response.trim()) {
            const ttsButton = document.getElementById('tts-button');
            ttsButton.style.display = 'block';
            ttsButton.setAttribute('data-text', data.response);
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
        hideLoading();
    });
}

// Handle thinking mode generation
function handleThinkingMode(prompt) {
    const thinkingContainer = document.getElementById('thinking');
    thinkingContainer.innerHTML = '<h4 style="color: #ff8930; margin-bottom: 0.5rem; font-weight: 600;">AI Thought Process</h4><em class="blinking">Processing thoughts...</em>';
    thinkingContainer.style.display = 'block';

    fetch('/api/generate-with-thinking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Hmm… grace takes time. Try again.');
        }
        return response.json();
    })
    .then(data => {
        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = marked.parse(data.response);

        // Render the thinking summary
        if (data.thinking_summary && data.thinking_summary.length > 0) {
            let thinkingHtml = '<h4 style="color: #ff8930; margin-bottom: 1rem; font-weight: 600;">AI Thought Process</h4>';
            data.thinking_summary.forEach((thought, index) => {
                const formattedThought = thought
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #e5e5e7;">$1</strong>')
                    .replace(/\n/g, '<br>')
                    .replace(/\. /g, '.<br><br>')
                    .replace(/\? /g, '?<br><br>')
                    .replace(/! /g, '!<br><br>');

                thinkingHtml += `
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--background-elevated); border-radius: var(--border-radius-small); box-shadow: var(--shadow-inset);">
                        <h5 style="color: #5b61a2; margin-bottom: 0.75rem; font-weight: 600; font-size: 14px;">Thought ${index + 1}:</h5>
                        <div style="color: var(--text-secondary); line-height: 1.6; font-size: 14px;">${formattedThought}</div>
                    </div>
                `;
            });
            thinkingContainer.innerHTML = thinkingHtml;
        } else {
            thinkingContainer.innerHTML = '<h4 style="color: #ff8930; margin-bottom: 0.5rem; font-weight: 600;">AI Thought Process</h4><p>Hmm… the thread is quiet. A fresh prompt may reveal more.</p>';
        }

        // Show the TTS button if we have a response
        if (data.response && data.response.trim()) {
            const ttsButton = document.getElementById('tts-button');
            ttsButton.style.display = 'block';
            ttsButton.setAttribute('data-text', data.response);
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
        thinkingContainer.innerHTML = '<h4 style="color: #ff8930; margin-bottom: 0.5rem; font-weight: 600;">AI Thought Process</h4><em>Error retrieving thinking process</em>';
        hideLoading();
    });
}

// Handle URL context generation
function handleUrlContext(prompt) {
    fetch('/api/generate-with-url-context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Hmm… grace takes time. Try again.');
        }
        return response.json();
    })
    .then(data => {
        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = marked.parse(data.response);

        // Show the TTS button if we have a response
        if (data.response && data.response.trim()) {
            const ttsButton = document.getElementById('tts-button');
            ttsButton.style.display = 'block';
            ttsButton.setAttribute('data-text', data.response);
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
        hideLoading();
    });
}

// Handle image generation
function handleImageGeneration(prompt) {
    const imageContainer = document.getElementById('image-container');
    const generatedImage = document.getElementById('generated-image');
    const imageMessage = document.getElementById('image-message');

    // Hide previous image
    generatedImage.style.display = 'none';

    fetch('/api/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to generate image');
            });
        }

        // Check if the response is JSON (error message) or blob (image)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.message || data.error || 'Failed to generate image');
            });
        }

        return response.blob();
    })
    .then(blob => {
        // Create a URL for the image blob
        const imageUrl = URL.createObjectURL(blob);

        // Set the image source and display it
        generatedImage.src = imageUrl;
        generatedImage.style.display = 'block';
        imageMessage.style.display = 'none';
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        imageMessage.textContent = `Error: ${error.message}`;
        imageMessage.style.display = 'block';
        hideLoading();
    });
}



// Function to handle text-to-speech
function textToSpeech() {
    const ttsButton = document.getElementById('tts-button');
    const audioPlayer = document.getElementById('audio-player');
    const text = ttsButton.getAttribute('data-text');

    if (!text) {
        return;
    }

    // Disable the button while processing
    ttsButton.disabled = true;
    ttsButton.textContent = 'Processing...';

    // Make an API call to the text-to-speech endpoint
    fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Hmm… grace takes time. Try again.');
        }
        return response.blob();
    })
    .then(blob => {
        // Create a URL for the audio blob
        const audioUrl = URL.createObjectURL(blob);

        // Set the audio source and display the player
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';

        // Play the audio
        audioPlayer.play();

        // Re-enable the button
        ttsButton.disabled = false;
        ttsButton.textContent = 'Listen (Text to Speech)';
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error generating speech: ${error.message}`);

        // Re-enable the button
        ttsButton.disabled = false;
        ttsButton.textContent = 'Listen (Text to Speech)';
    });
}

// Input handling for unified search
function setupUnifiedSearchHandlers() {
    const input = document.querySelector('.unified-input');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');

    // Handle submit button click
    submitButton.addEventListener('click', handleUnifiedSearch);

    // Handle clear button click
    clearButton.addEventListener('click', function() {
        input.value = '';
        clearButton.style.display = 'none';
        clearResults();
        input.focus();
    });

    // Handle Enter key press
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleUnifiedSearch();
        }
    });

    // Show/hide clear button based on input content
    input.addEventListener('input', function() {
        clearButton.style.display = input.value.trim() ? 'block' : 'none';

        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Auto-focus on input
    input.focus();
}

function addPromptSuggestions() {
    const input = document.querySelector('.unified-input');

    // Clear existing suggestions
    const searchContainer = document.querySelector('.search-container');
    const existingSuggestionsContainer = searchContainer.querySelector('.prompt-suggestions');
    if (existingSuggestionsContainer) {
        searchContainer.removeChild(existingSuggestionsContainer);
    }

    // Prompt suggestions
const promptSuggestions = {
    'Canvas': [
        'Write a short poem about your favorite season',
        '',
        ''
    ],
    'AI Thinking': [
        'Hey, how are you?',
        '',
        ''
    ],
    'Web search': [
        'Analyze the content of https://www.bbc.com/news',
        '',
        '',
    ],
    'Image generation': [
    'SpaceX rocket launch at sunset',
    '',
    ''
    ]
};



    // Get selected tab
    const selectedTab = document.querySelector('.search-tab.active');
    const tabName = selectedTab.textContent.trim();

    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('prompt-suggestions');
    suggestionsContainer.style.padding = '0.5rem 1.5rem';
    suggestionsContainer.style.fontSize = '14px';
    suggestionsContainer.style.color = 'var(--text-secondary)';

    // Add suggestions to container
    promptSuggestions[tabName].forEach(suggestion => {
        const suggestionElement = document.createElement('span');
        suggestionElement.textContent = suggestion;
        suggestionElement.style.marginRight = '0.5rem';
        suggestionElement.style.cursor = 'pointer'; // Add cursor pointer
        suggestionElement.addEventListener('click', function() { // Add click listener
            input.value = suggestion; // Set input value to suggestion
            handleUnifiedSearch(); // Trigger search
        });
        suggestionsContainer.appendChild(suggestionElement);
    });

    // Insert suggestions container after input wrapper
    const searchInputWrapper = document.querySelector('.search-input-wrapper');
    searchContainer.insertBefore(suggestionsContainer, searchInputWrapper.nextSibling);
}

// Function to toggle collapsible sections
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const header = content.previousElementSibling;
    const icon = header.querySelector('.section-icon');

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        header.classList.remove('active');
        icon.textContent = '▼';
    } else {
        content.classList.add('active');
        header.classList.add('active');
        icon.textContent = '▲';
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupUnifiedSearchHandlers();
    setupTTSHandler();
    setupCookieNotification();
    setupMenuHandlers();
    setupThemeToggle();
    setupSearchTabs();
});

// Setup TTS handler
function setupTTSHandler() {
    document.getElementById('tts-button').addEventListener('click', textToSpeech);
}

// Setup cookie notification
function setupCookieNotification() {
    const cookieNotification = document.getElementById('cookie-notification');
    const acceptCookiesButton = document.getElementById('accept-cookies');

    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');

    if (!cookiesAccepted) {
        // Show the notification with a slight delay for better UX
        setTimeout(function() {
            cookieNotification.classList.add('show');
        }, 1000);
    }

    // Handle accept button click
    acceptCookiesButton.addEventListener('click', function() {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieNotification.classList.remove('show');
    });
}

// Setup menu handlers
function setupMenuHandlers() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    // Open menu
    menuToggle.addEventListener('click', function() {
        openMenu();
    });

    // Close menu
    closeMenu.addEventListener('click', function() {
        closeMenuHandler();
    });

    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', function() {
        closeMenuHandler();
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sidebarMenu.classList.contains('open')) {
            closeMenuHandler();
        }
    });

    function openMenu() {
        sidebarMenu.classList.add('open');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeMenuHandler() {
        sidebarMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme preference or default to 'dark'
    const currentTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', currentTheme);

    // Update theme toggle icon
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('svg');
        if (theme === 'light') {
            // Moon icon for light theme (to switch to dark)
            icon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
            `;
        } else {
            // Sun icon for dark theme (to switch to light)
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
            `;
        }
    }
}

// Setup search tabs
function setupSearchTabs() {
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from other tabs
            searchTabs.forEach(tab => tab.classList.remove('active'));

            // Add active class to this tab
            this.classList.add('active');

            // Update prompt suggestions
            addPromptSuggestions();
        });
    });
}

function getSelectedMode() {
    const activeTab = document.querySelector('.search-tab.active');
    return {
        mode: activeTab.dataset.mode,
        style: activeTab.dataset.style
    };
}

// Character-by-character animation
function animateText(element) {
    const text = element.textContent;
    element.textContent = '';
    let i = 0;
    const intervalId = setInterval(() => {
        element.textContent += text[i];
        i++;
        if (i === text.length) {
            clearInterval(intervalId);
        }
    }, 20);
}
