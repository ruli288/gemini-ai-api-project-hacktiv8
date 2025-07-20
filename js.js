document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const tabs = { chat: document.getElementById('tab-chat'), writer: document.getElementById('tab-writer'), image: document.getElementById('tab-image'), media: document.getElementById('tab-media') };
    const contents = { chat: document.getElementById('content-chat'), writer: document.getElementById('content-writer'), image: document.getElementById('content-image'), media: document.getElementById('content-media') };
    const buttons = { chat: document.getElementById('chat-submit'), writer: document.getElementById('writer-submit'), image: document.getElementById('image-submit') };
    const inputs = { chat: document.getElementById('chat-input'), writer: document.getElementById('writer-input'), image: document.getElementById('image-input') };
    const outputs = { chat: document.getElementById('chat-output'), writer: document.getElementById('writer-output'), image: document.getElementById('image-output') };
    const micButtons = { chat: document.getElementById('mic-chat'), writer: document.getElementById('mic-writer'), media: document.getElementById('mic-media') }; // Added media mic
    const featureContainers = { chat: document.getElementById('chat-features'), writer: document.getElementById('writer-features') };
    const featureButtons = {
        summarize: document.getElementById('feature-summarize'),
        simplify: document.getElementById('feature-simplify'),
        email: document.getElementById('feature-email'),
        continue: document.getElementById('feature-continue'),
        suggest: document.getElementById('feature-suggest'),
    };

    // Media Player elements
    const musicUrlInput = document.getElementById('music-url-input');
    const videoUrlInput = document.getElementById('video-url-input');
    const audioPlayer = document.getElementById('audio-player');
    const videoPlayer = document.getElementById('video-player');
    const playMusicBtn = document.getElementById('play-music');
    const pauseMusicBtn = document.getElementById('pause-music');
    const stopMusicBtn = document.getElementById('stop-music');
    const playVideoBtn = document.getElementById('play-video');
    const pauseVideoBtn = document.getElementById('pause-video');
    const stopVideoBtn = document.getElementById('stop-video');
    const mediaMicInput = document.getElementById('media-mic-input');


    // Store original text for feature modifications
    let originalResponse = { chat: '', writer: '' };

    // --- Tab Switching Logic ---
    const switchTab = (activeTab) => {
        Object.keys(tabs).forEach(key => {
            tabs[key].classList.remove('tab-active');
            tabs[key].classList.add('tab-inactive');
            contents[key].classList.add('hidden');
        });
        tabs[activeTab].classList.add('tab-active');
        tabs[activeTab].classList.remove('tab-inactive');
        contents[activeTab].classList.remove('hidden');

        // Pause all media when switching tabs
        audioPlayer.pause();
        videoPlayer.pause();
    };

    Object.keys(tabs).forEach(key => tabs[key].addEventListener('click', () => switchTab(key)));

    // --- Speech Recognition Logic ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        let isListening = false;
        let activeMicButton = null;
        let activeTextarea = null;

        recognition.onstart = () => { isListening = true; activeMicButton?.classList.add('mic-listening'); };
        recognition.onend = () => { isListening = false; activeMicButton?.classList.remove('mic-listening'); activeMicButton = null; };
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (activeTextarea) {
                activeTextarea.value = transcript;
                // If it's the media mic, process the command
                if (activeTextarea === mediaMicInput) {
                    processMediaVoiceCommand(transcript);
                }
            }
        };
        recognition.onerror = (event) => { console.error("Speech recognition error: - js.js:78", event.error); };

        const toggleListening = (micButton, textarea) => {
            if (isListening) { recognition.stop(); } 
            else { activeMicButton = micButton; activeTextarea = textarea; recognition.start(); }
        };
        micButtons.chat.addEventListener('click', () => toggleListening(micButtons.chat, inputs.chat));
        micButtons.writer.addEventListener('click', () => toggleListening(micButtons.writer, inputs.writer));
        micButtons.media.addEventListener('click', () => toggleListening(micButtons.media, mediaMicInput)); // New mic for media
    } else {
        console.warn("Speech Recognition not supported. - js.js:88");
        Object.values(micButtons).forEach(btn => btn.disabled = true);
    }

    // --- API Call Logic ---
    const apiKey = ""; // Handled by execution environment

    const toggleLoading = (button, isLoading) => {
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        button.disabled = isLoading;
        if(buttonText) buttonText.classList.toggle('hidden', isLoading);
        if(spinner) spinner.classList.toggle('hidden', !isLoading);
    };
    
    const callGeminiTextAPI = async (prompt, button, outputElement) => {
        // Ensure outputElement is valid before trying to set innerHTML
        if (outputElement) {
            outputElement.innerHTML = '<p class="text-gray-500">Generating...</p>';
        }
        
        // Only toggle loading if a button is provided
        if (button) {
            toggleLoading(button, true);
        }

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (error) {
            console.error("Error calling Gemini API: - js.js:126", error);
            if (outputElement) {
                outputElement.innerHTML = `<p class="text-red-500">An error occurred: ${error.message}.</p>`;
            }
            return null;
        } finally {
            if (button) {
                toggleLoading(button, false);
            }
        }
    };

    const generateText = async (prompt, button, outputElement, type) => {
        if (!prompt.trim()) {
            outputElement.innerHTML = '<p class="text-red-500">Please enter a prompt.</p>';
            return;
        }
        const text = await callGeminiTextAPI(prompt, button, outputElement);
        if (text) {
            outputElement.innerHTML = marked.parse(text);
            originalResponse[type] = text; // Save original response
            featureContainers[type]?.classList.remove('hidden'); // Show feature buttons
        } else {
            featureContainers[type]?.classList.add('hidden');
        }
    };

    const generateImage = async (prompt, button, outputElement) => {
         if (!prompt.trim()) {
            outputElement.innerHTML = '<p class="text-red-500">Please enter an image description.</p>';
            return;
        }
        toggleLoading(button, true);
        outputElement.innerHTML = `<div class="flex flex-col items-center justify-center text-gray-500"><div class="spinner w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mb-4"></div><p>Generating your image...</p></div>`;
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            const payload = { instances: [{ prompt }], parameters: { "sampleCount": 1 } };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const result = await response.json();
            if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
                const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                outputElement.innerHTML = `<img src="${imageUrl}" alt="${prompt}" class="w-full h-full object-contain rounded-lg">`;
            } else {
                throw new Error("No image data received from API.");
            }
        } catch (error) {
            console.error("Error generating image: - js.js:173", error);
            outputElement.innerHTML = `<p class="text-red-500">An error occurred: ${error.message}.</p>`;
        } finally {
            toggleLoading(button, false);
        }
    };

    // --- Main Event Listeners ---
    buttons.chat.addEventListener('click', () => generateText(inputs.chat.value, buttons.chat, outputs.chat, 'chat'));
    buttons.writer.addEventListener('click', () => generateText(inputs.writer.value, buttons.writer, outputs.writer, 'writer'));
    buttons.image.addEventListener('click', () => generateImage(inputs.image.value, buttons.image, outputs.image));

    // --- Feature Button Event Listeners ---
    featureButtons.summarize.addEventListener('click', async () => {
        const prompt = `Summarize the following text into exactly three concise key points, using bullet points:\n\n---\n\n${originalResponse.chat}`;
        const summary = await callGeminiTextAPI(prompt, featureButtons.summarize, outputs.chat);
        if (summary) outputs.chat.innerHTML = marked.parse(summary);
    });

    featureButtons.simplify.addEventListener('click', async () => {
        const prompt = `Explain the following text in very simple terms, as if you were talking to a 5-year-old:\n\n---\n\n${originalResponse.chat}`;
        const simplifiedText = await callGeminiTextAPI(prompt, featureButtons.simplify, outputs.chat);
        if (simplifiedText) outputs.chat.innerHTML = marked.parse(simplifiedText);
    });

    featureButtons.email.addEventListener('click', async () => {
        const prompt = `Based on the following text, draft a professional follow-up email. Include a clear subject line, a brief summary of the key points, and a call to action. Use placeholders like [Recipient Name] and [Your Name].\n\n---\n\n${originalResponse.chat}`;
        const email = await callGeminiTextAPI(prompt, featureButtons.email, outputs.chat);
        if (email) outputs.chat.innerHTML = marked.parse(email);
    });

    featureButtons.continue.addEventListener('click', async () => {
        const prompt = `Continue writing the following text in the same style and tone. Make the continuation seamless and engaging:\n\n---\n\n${originalResponse.writer}`;
        const continuation = await callGeminiTextAPI(prompt, featureButtons.continue, outputs.writer);
        if (continuation) {
            const combinedText = originalResponse.writer + "\n\n" + continuation;
            outputs.writer.innerHTML = marked.parse(combinedText);
            originalResponse.writer = combinedText; // Update original text for further continuation
        }
    });

    featureButtons.suggest.addEventListener('click', async () => {
        const prompt = "Suggest one creative and visually interesting image prompt. Be descriptive and imaginative. Provide only the prompt text itself, with no extra conversational text.";
        const suggestion = await callGeminiTextAPI(prompt, featureButtons.suggest, inputs.image); // Use inputs.image as a temporary output for the suggestion
        if (suggestion) {
            inputs.image.value = suggestion.trim().replace(/"/g, ''); // Clean up suggestion
        }
    });

    // --- Media Player Logic ---
    playMusicBtn.addEventListener('click', () => {
        const url = musicUrlInput.value.trim();
        if (url) {
            audioPlayer.src = url;
            audioPlayer.play().catch(e => console.error("Error playing audio: - js.js:227", e));
        } else {
            alert("Please enter a music URL.");
        }
    });

    pauseMusicBtn.addEventListener('click', () => audioPlayer.pause());
    stopMusicBtn.addEventListener('click', () => { audioPlayer.pause(); audioPlayer.currentTime = 0; });

    playVideoBtn.addEventListener('click', () => {
        const url = videoUrlInput.value.trim();
        if (url) {
            videoPlayer.src = url;
            videoPlayer.play().catch(e => console.error("Error playing video: - js.js:240", e));
        } else {
            alert("Please enter a video URL.");
        }
    });

    pauseVideoBtn.addEventListener('click', () => videoPlayer.pause());
    stopVideoBtn.addEventListener('click', () => { videoPlayer.pause(); videoPlayer.currentTime = 0; });

    // --- Process Media Voice Command ---
    const processMediaVoiceCommand = (command) => {
        command = command.toLowerCase();
        const urlMatch = /(https?:\/\/[^\s]+)/.exec(command);
        const url = urlMatch ? urlMatch[1] : null;

        if (command.includes("play music")) {
            if (url) {
                musicUrlInput.value = url;
                audioPlayer.src = url;
                audioPlayer.play().catch(e => console.error("Error playing audio: - js.js:259", e));
            } else {
                alert("Please specify a music URL in your command or input field.");
            }
        } else if (command.includes("play video")) {
            if (url) {
                videoUrlInput.value = url;
                videoPlayer.src = url;
                videoPlayer.play().catch(e => console.error("Error playing video: - js.js:267", e));
            } else {
                alert("Please specify a video URL in your command or input field.");
            }
        } else if (command.includes("pause music")) {
            audioPlayer.pause();
        } else if (command.includes("stop music")) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        } else if (command.includes("pause video")) {
            videoPlayer.pause();
        } else if (command.includes("stop video")) {
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
        } else {
            alert("Unrecognized media command. Try 'play music [URL]', 'pause video', etc.");
        }
    };
});
