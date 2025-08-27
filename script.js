// DOM Elements
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const newQuoteBtn = document.getElementById('new-quote');
const copyQuoteBtn = document.getElementById('copy-quote');
const githubSubmit = document.getElementById('github-submit');
const githubTokenInput = document.getElementById('github-token');
const repoNameInput = document.getElementById('repo-name');
const fileNameInput = document.getElementById('file-name');
const commitMessageInput = document.getElementById('commit-message');
const githubStatus = document.getElementById('github-status');
const toast = document.getElementById('toast');

// Current quote storage
let currentQuote = { text: '', author: '' };

// Function to fetch a random quote from an API
async function getRandomQuote() {
    try {
        quoteText.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> Loading quote...</span>';
        quoteAuthor.textContent = '';
        
        // Using Quotable API for random quotes
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        
        if (response.ok) {
            currentQuote = {
                text: data.content,
                author: data.author
            };
            
            quoteText.textContent = data.content;
            quoteAuthor.textContent = `— ${data.author}`;
        } else {
            throw new Error('Failed to fetch quote');
        }
    } catch (error) {
        console.error('Error fetching quote:', error);
        quoteText.textContent = 'Failed to fetch quote. Please try again.';
        quoteAuthor.textContent = '';
        
        // Fallback quotes in case of API failure
        const fallbackQuotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
        ];
        
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        currentQuote = randomQuote;
        
        setTimeout(() => {
            quoteText.textContent = randomQuote.text;
            quoteAuthor.textContent = `— ${randomQuote.author}`;
        }, 1500);
    }
}

// Function to copy quote to clipboard
function copyToClipboard() {
    const textToCopy = `"${currentQuote.text}" ${currentQuote.author}`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('Quote copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy quote to clipboard');
        });
}

// Function to show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Function to update GitHub status message
function updateStatus(message, type) {
    githubStatus.textContent = message;
    githubStatus.className = 'status-message';
    
    if (type) {
        githubStatus.classList.add(`status-${type}`);
    }
}

// Function to push quote to GitHub
async function pushToGitHub() {
    const token = githubTokenInput.value.trim();
    const repoName = repoNameInput.value.trim();
    const fileName = fileNameInput.value.trim();
    const commitMessage = commitMessageInput.value.trim();
    
    if (!token || !repoName || !fileName || !commitMessage) {
        updateStatus('Please fill in all fields', 'error');
        return;
    }
    
    if (!token.startsWith('ghp_')) {
        updateStatus('Please enter a valid GitHub token', 'error');
        return;
    }
    
    try {
        updateStatus('Pushing to GitHub...', 'loading');
        
        // Get the current file content if it exists
        let sha = null;
        try {
            const getContentResponse = await fetch(
                `https://api.github.com/repos/${repoName}/contents/${fileName}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (getContentResponse.ok) {
                const contentData = await getContentResponse.json();
                sha = contentData.sha;
            }
        } catch (error) {
            // File doesn't exist yet, which is fine
            console.log('File does not exist yet, will create new file');
        }
        
        // Prepare the quote content
        const quoteContent = `"${currentQuote.text}" — ${currentQuote.author}\n\n`;
        const content = btoa(unescape(encodeURIComponent(quoteContent)));
        
        // Push to GitHub
        const response = await fetch(
            `https://api.github.com/repos/${repoName}/contents/${fileName}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: content,
                    sha: sha
                })
            }
        );
        
        if (response.ok) {
            updateStatus('Successfully pushed quote to GitHub!', 'success');
            showToast('Quote saved to GitHub!');
            
            // Clear form
            commitMessageInput.value = '';
        } else {
            const errorData = await response.json();
            console.error('GitHub API error:', errorData);
            updateStatus(`Error: ${errorData.message}`, 'error');
        }
    } catch (error) {
        console.error('Error pushing to GitHub:', error);
        updateStatus('Failed to push to GitHub. Please check your credentials.', 'error');
    }
}

// Event listeners
newQuoteBtn.addEventListener('click', getRandomQuote);
copyQuoteBtn.addEventListener('click', copyToClipboard);
githubSubmit.addEventListener('click', pushToGitHub);

// Get a quote when the page loads
getRandomQuote();
