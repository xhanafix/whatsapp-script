// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyButton = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const productDescriptionInput = document.getElementById('productDescription');
const generateScriptButton = document.getElementById('generateScript');
const clearFormButton = document.getElementById('clearForm');
const copyScriptButton = document.getElementById('copyScript');
const outputText = document.getElementById('outputText');
const previewText = document.getElementById('previewText');
const scriptOutput = document.getElementById('scriptOutput');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const themeToggleButton = document.getElementById('themeToggle');

// Constants
const API_KEY_STORAGE_KEY = 'whatsapp_script_api_key';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/learnlm-1.5-pro-experimental:free';
const THEME_STORAGE_KEY = 'whatsapp_script_theme';

// Load API key from local storage when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    document.documentElement.className = savedTheme + '-theme';
    
    // Update button text based on current theme
    updateThemeToggleButton();
    
    // Load saved API key
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        showApiKeyStatus('API key loaded successfully!', 'success');
    }
});

// Save API key to local storage
saveApiKeyButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showApiKeyStatus('Please enter an API key', 'error');
        return;
    }
    
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    showApiKeyStatus('API key saved successfully!', 'success');
});

// Generate WhatsApp Script
generateScriptButton.addEventListener('click', async () => {
    // Clear previous output and errors
    hideElement(errorMessage);
    hideElement(scriptOutput);
    
    const productDescription = productDescriptionInput.value.trim();
    const language = document.querySelector('input[name="language"]:checked').value;
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    
    // Validate inputs
    if (!apiKey) {
        showError('Please save your OpenRouter API key first');
        return;
    }
    
    if (!productDescription) {
        showError('Please enter a product or service description');
        return;
    }
    
    // Show loading indicator
    showElement(loadingIndicator);
    
    try {
        const script = await generateSalesScript(productDescription, language, apiKey);
        
        // Update output and preview
        outputText.textContent = script;
        updateChatPreview(script);
        
        // Hide loading and show output
        hideElement(loadingIndicator);
        showElement(scriptOutput);
        
    } catch (error) {
        hideElement(loadingIndicator);
        showError(error.message || 'Failed to generate script. Please try again.');
    }
});

// Copy to clipboard functionality
copyScriptButton.addEventListener('click', () => {
    navigator.clipboard.writeText(outputText.textContent)
        .then(() => {
            const originalText = copyScriptButton.textContent;
            copyScriptButton.textContent = 'Copied!';
            setTimeout(() => {
                copyScriptButton.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            showError('Failed to copy text: ' + err);
        });
});

// Clear form
clearFormButton.addEventListener('click', () => {
    productDescriptionInput.value = '';
    document.getElementById('english').checked = true;
    hideElement(scriptOutput);
    hideElement(errorMessage);
});

// Generate sales script using OpenRouter API
async function generateSalesScript(productDescription, language, apiKey) {
    // Construct prompt based on selected language
    let prompt;
    
    if (language === 'bahasa') {
        prompt = `
Tolong buatkan skrip perbualan WhatsApp dalam Bahasa Malaysia yang kolokial antara PENJUAL dan PEMBELI untuk produk/perkhidmatan berikut:

${productDescription}

Skrip perbualan perlu:
1. Mesra dan santai seperti perbualan biasa di WhatsApp
2. Menggunakan Bahasa Malaysia yang kolokial/tidak formal (cth: "Hai", "nak", "boleh", dll.)
3. Mengandungi senario jualan yang realistik, termasuk:
   - Pembuka yang menarik minat
   - Pengenalan produk/perkhidmatan
   - Pembeli mengemukakan soalan dan kebimbangan
   - Pembeli membuat bantahan tentang harga/kualiti/dll
   - Penjual menangani bantahan dengan baik
   - Fasa pertimbangan oleh pembeli
   - Rundingan (jika bersesuaian)
   - Penutup yang berkesan dengan tindakan seterusnya
4. Sesuai dengan format WhatsApp (mudah dibaca di telefon)
5. Mengandungi emoji yang sesuai
6. Format setiap mesej dengan jelas siapa yang bercakap (contoh: "PENJUAL: [mesej]" dan "PEMBELI: [mesej]")

Berikan skrip perbualan sahaja tanpa penjelasan tambahan.`;
    } else {
        prompt = `
Please create a WhatsApp conversation script in English between a SELLER and a BUYER for the following product/service:

${productDescription}

The conversation script should:
1. Be friendly and conversational in tone
2. Professional yet casual and appropriate for WhatsApp
3. Include realistic sales scenarios such as:
   - Engaging opening
   - Product/service introduction
   - Buyer asking questions and raising concerns
   - Buyer objecting to price/quality/etc.
   - Seller effectively handling objections
   - Consideration phase by the buyer
   - Negotiation (if appropriate)
   - Effective closing with next steps
4. Be formatted appropriately for WhatsApp (easy to read on mobile)
5. Include appropriate emojis
6. Clearly format each message with who is speaking (e.g., "SELLER: [message]" and "BUYER: [message]")

Provide only the conversation script without additional explanations.`;
    }

    // API request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'WhatsApp Conversation Script Generator'
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional sales and marketing expert specialized in creating realistic WhatsApp sales conversations that include typical objections, consideration phases, and effective selling techniques.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Utility functions
function showApiKeyStatus(message, type) {
    apiKeyStatus.textContent = message;
    apiKeyStatus.className = 'status ' + type;
    
    // Hide status after 3 seconds
    setTimeout(() => {
        apiKeyStatus.textContent = '';
        apiKeyStatus.className = 'status';
    }, 3000);
}

function showError(message) {
    errorMessage.textContent = message;
    showElement(errorMessage);
}

function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    document.documentElement.className = savedTheme + '-theme';
    
    // Update button text based on current theme
    updateThemeToggleButton();
    
    // Load saved API key
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        showApiKeyStatus('API key loaded successfully!', 'success');
    }
});

// Theme toggle handler
themeToggleButton.addEventListener('click', () => {
    const currentTheme = document.documentElement.className.includes('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.className = newTheme + '-theme';
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    updateThemeToggleButton();
});

// Update theme toggle button appearance based on current theme
function updateThemeToggleButton() {
    const isDarkTheme = document.documentElement.className.includes('dark');
    
    // Update button icon and text
    themeToggleButton.innerHTML = isDarkTheme 
        ? '<i class="fas fa-sun"></i><span>Light Mode</span>' 
        : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
}

// Update the chat preview with conversation bubbles
function updateChatPreview(script) {
    const chatPreview = document.getElementById('chatPreview');
    chatPreview.innerHTML = '';
    
    const lines = script.split('\n').filter(line => line.trim() !== '');
    
    // Generate random timestamps for messages
    const startTime = new Date();
    startTime.setHours(9);
    startTime.setMinutes(Math.floor(Math.random() * 60));
    
    let currentTime = new Date(startTime);
    
    lines.forEach(line => {
        // Increment time by a random amount (1-3 minutes)
        currentTime = new Date(currentTime.getTime() + (Math.floor(Math.random() * 3) + 1) * 60000);
        const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (line.toLowerCase().startsWith('seller:') || line.toLowerCase().startsWith('penjual:')) {
            const messageText = line.split(':').slice(1).join(':').trim();
            const bubble = document.createElement('div');
            bubble.className = 'seller-bubble';
            bubble.innerHTML = messageText + `<div class="timestamp">${timeString}</div>`;
            chatPreview.appendChild(bubble);
        } else if (line.toLowerCase().startsWith('buyer:') || line.toLowerCase().startsWith('pembeli:')) {
            const messageText = line.split(':').slice(1).join(':').trim();
            const bubble = document.createElement('div');
            bubble.className = 'buyer-bubble';
            bubble.innerHTML = messageText + `<div class="timestamp">${timeString}</div>`;
            chatPreview.appendChild(bubble);
        } else {
            // Handle lines without a prefix (instructions or other text)
            const bubble = document.createElement('div');
            bubble.className = 'system-message';
            bubble.textContent = line;
            chatPreview.appendChild(bubble);
        }
    });
    
    // Scroll to the bottom of the chat preview
    setTimeout(() => {
        chatPreview.scrollTop = chatPreview.scrollHeight;
    }, 100);
} 