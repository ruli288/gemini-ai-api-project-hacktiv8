//script.js
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userMessage = input.value.trim();
    if (!userMessage) return;
    
    appendMessage('user', userMessage);
    input.value = '';

    // Simulasi dummy AI response
    setTimeout(() => {
        appendMessage('bot', 'Gemini is thinking');
    }, 1000);
})

function appendMessage(sender, message) {

    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.textContent = message;
    chatBox.appendChild(msg);
    chatBox.scrollTop =chatBox.scrollHeight ;
}