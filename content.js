
function createAIButton() {
    const button = document.createElement('div');
    button.className = 'design ai-reply-button T-I J-J5-Ji aoO v7 T-I-atl L3';

    button.innerHTML = 'AI Reply';
    button.setAttribute('role','button');
    button.setAttribute('data-tooltip','Generate AI Reply');
    return button;
}

function createToneSelector() {
    const select = document.createElement('select');
    select.className = 'design ai-tone-selector T-I J-J5-Ji aoO v7 T-I-atl L3';

    const tones = ['Professional', 'Casual', 'Friendly', 'Sarcastic'];
    tones.forEach((tone) => {
      const option = document.createElement('option');
      option.value = tone.toLowerCase();
      option.innerText = tone;
      select.appendChild(option);
    });
  
    return select;
}

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
  
    for(const selector of selectors) {
      const content = document.querySelector(selector);
      if(content) return content.innerText.trim();
    }
    return "";
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];

    for(const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if(toolbar) return toolbar;
    }
    return null;
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();
    const existingSelector = document.querySelector('.ai-tone-selector');
    if (existingSelector) existingSelector.remove();

    const toolbar = findComposeToolbar();
    if(!toolbar) return;

    const button = createAIButton();
    const toneSelector = createToneSelector();

    // Backend API call
    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            const selectedTone = toneSelector.value;

            // Get Backend API URL
            const configUrl = chrome.runtime.getURL('config.json');
            const responseUrl = await fetch(configUrl);
            if (!responseUrl.ok) {
                throw new Error('Failed to fetch config.json');
            }
            const config = await responseUrl.json();
            const apiUrl = config.API_URL;

            // Hit backend
            const response = await fetch(apiUrl + '/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    emailContent: emailContent,
                    tone: selectedTone
                })
            });

            if(!response.ok) {
                throw new Error('AI Reply failed');
            }

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            
            if(composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                // console.log('Compose box not found');
            }

        } catch (error) {
            alert('Failed to generate AI Reply');
        } finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
    toolbar.insertBefore(toneSelector, toolbar.firstChild);
};

// MutationObserver to detect when the compose window is opened
const observer = new MutationObserver((mutations) => {
    for(const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);  
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        if(hasComposeElements) {
            // console.log("Compose window detected");
            setTimeout(injectButton, 500);
        };
    };
});

// Observe the body for changes
observer.observe(document.body, { 
    childList: true, 
    subtree: true 
});