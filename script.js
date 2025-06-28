// Configuration
const API_BASE_URL= 'https://recon-xh9b.onrender.com'; // This is a placeholder for your actual backend API

// DOM Elements
const dashboardSection = document.getElementById('dashboard-section');
const profileStep = document.getElementById('profile-step');
const loadingState = document.getElementById('loading-state');
const resultsSection = document.getElementById('results-section');
const profileForm = document.getElementById('profile-form');
const matchesContainer = document.getElementById('matches-container');
const matchesOverviewSection = document.getElementById('matches-overview-section');
const messagesSection = document.getElementById('messages-section');

const navDashboard = document.getElementById('nav-dashboard');
const navProfile = document.getElementById('nav-profile');
const navMatches = document.getElementById('nav-matches');
const navMessages = document.getElementById('nav-messages');
const startNewMatchButton = document.getElementById('start-new-match');
const viewAllMatchesButton = document.getElementById('view-all-matches');

const totalMatchesElement = document.getElementById('total-matches');
const applicationsSentElement = document.getElementById('applications-sent');
const upcomingMeetingsElement = document.getElementById('upcoming-meetings');
const activityListElement = document.getElementById('activity-list');
const loadingTextElement = document.getElementById('loading-text');

// Matches Overview Elements
const totalUniqueMatchesElement = document.getElementById('total-unique-matches');
const highestMatchScoreElement = document.getElementById('highest-match-score');
const newMatchesWeekElement = document.getElementById('new-matches-week');
const topMatchesListElement = document.getElementById('top-matches-list');
const matchesOverviewTitle = document.getElementById('matches-overview-title');
const matchesOverviewSubtitle = document.getElementById('matches-overview-subtitle');

// Messages Elements
const messageListElement = document.getElementById('message-list');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const messagesTitle = document.getElementById('messages-title');
const messagesSubtitle = document.getElementById('messages-subtitle');
const typingIndicator = document.getElementById('typing-indicator'); // New typing indicator element

// Character/Avatar Data
const characterAvatars = {
    founder: {
        name: "Founder",
        color: "#4A69BD",
        icon: "👨‍💻" // Emoji for pixelated look
    },
    investor: {
        name: "Investor Bot",
        color: "#27AE60",
        icon: "🤖" // Emoji for pixelated look
    }
};


// --- Utility Functions for Animations and Dynamic Text ---

/**
 * Animates a number counting up to a target value.
 * @param {HTMLElement} element - The DOM element to update.
 * @param {number} start - The starting number.
 * @param {number} end - The target number.
 * @param {number} duration - The duration of the animation in milliseconds.
 */
function animateNumber(element, start, end, duration) {
    let startTime = null;
    const step = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        element.textContent = Math.floor(start + progress * (end - start));
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    requestAnimationFrame(step);
}

/**
 * Simulates a typing effect for a given text.
 * @param {HTMLElement} element - The DOM element to apply the typing effect to.
 * @param {string} text - The text to type.
 * @param {number} delay - Delay between each character in milliseconds.
 */
function typeText(element, text, delay = 50) {
    let i = 0;
    element.textContent = ''; // Clear existing text
    const typingInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
        }
    }, delay);
}

// --- API Helper Functions ---
async function apiCall(endpoint, options = {}) {
    try {
        // Simulate API call delay for better UX (optional, can be removed for production)
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500)); // 0.8 to 1.3 seconds delay

        // Construct the full API URL. Assuming the Flask backend is on the same host.
         // If your Flask backend is on a different origin, specify it here, e.g., 'http://localhost:5000'
        const url = `${API_BASE_URL}${endpoint}`;

        // Make the real fetch call
        const response = await fetch(url, {
            method: options.method || 'GET', // Default to GET if not specified
            headers: {
                'Content-Type': 'application/json',
                ...options.headers // Allow overriding or adding more headers
            },
            body: options.body // The body should already be a JSON string from the caller
        });

        if (!response.ok) {
            // If the response status is not 2xx, throw an error
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        // Parse the JSON response
        return await response.json();

    } catch (error) {
        console.error('API call failed:', error);
        // Re-throw the error so the caller can handle it
        throw error;
    }
}

// --- UI Display Functions ---
function displayMatches(matches, founderProfile) {
    matchesContainer.innerHTML = ''; // Clear previous matches
    
    if (!matches || matches.length === 0) {
        matchesContainer.innerHTML = `
            <div class="match-card animate-pop" style="border-left-color: var(--text-light);">
                <h3>No strong matches found</h3>
                <p>We couldn't find any investors that strongly match your current criteria. Try adjusting your requirements or check back later as we add more investors to our platform.</p>
            </div>
        `;
        return;
    }

    matches.forEach((match, index) => {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card', 'animate-pop');
        matchCard.style.animationDelay = `${index * 0.1}s`; // Stagger animation
        
        matchCard.innerHTML = `
            <div class="match-header">
                <div class="investor-name">${match.investor.name}</div>
                <div class="match-score">${match.score}/7 Match</div>
            </div>
            
            <p style="color: var(--text-light); margin-bottom: 1rem;">
                ${match.investor.description}
            </p>
            
            <div class="match-details">
                ${match.match_reasons.map(reason => `
                    <div class="detail-item">
                        <div class="detail-icon"></div>
                        <span>${reason}</span>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                <small style="color: var(--text-light);">
                    Investment Range: $${match.investor.investment_range[0].toLocaleString()} - $${match.investor.investment_range[1].toLocaleString()}
                    | Risk Tolerance: ${match.investor.risk_tolerance.charAt(0).toUpperCase() + match.investor.risk_tolerance.slice(1)}
                    ${match.investor.location ? ` | ${match.investor.location}` : ''}
                </small>
            </div>
            
            ${match.investor.contact ? `
                <div style="margin-top: 0.5rem;">
                    <small style="color: var(--primary-blue);">
                        📧 <a href="mailto:${match.investor.contact}" style="text-decoration: none; color: inherit;">${match.investor.contact}</a>
                    </small>
                </div>
            ` : ''}
        `;
        matchesContainer.appendChild(matchCard);
    });
}

function displayError(errorMessage) {
    matchesContainer.innerHTML = `
        <div class="match-card animate-pop" style="border-left-color: #E74C3C;">
            <h3 style="color: #E74C3C;">Error</h3>
            <p>${errorMessage}</p>
            <button class="btn btn-primary animate-pop" onclick="resetForm()" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
}

/**
 * Populates the dashboard with mock data and animations.
 */
function populateDashboard() {
    // Animate numbers
    animateNumber(totalMatchesElement, 0, 12, 1000);
    animateNumber(applicationsSentElement, 0, 5, 1200);
    animateNumber(upcomingMeetingsElement, 0, 2, 1500);

    // Type out welcome messages
    typeText(document.getElementById('dashboard-welcome-title'), "Welcome to Your Dashboard!", 40);
    setTimeout(() => {
        typeText(document.getElementById('dashboard-welcome-subtitle'), "Your hub for managing investor relationships.", 30);
    }, 1000); // Start typing subtitle after title

    // Populate recent activities with staggered animation
    const activities = [
        { icon: '🤝', text: 'Matched with **"Venture Capital X"** for your SaaS startup.', time: '2 hours ago' },
        { icon: '📝', text: 'Your profile for **"InnovateCo"** was updated.', time: '1 day ago' },
        { icon: '📅', text: 'Meeting scheduled with **"Angel Investor Group"** on July 5th.', time: '3 days ago' },
        { icon: '🚀', text: 'New investor **"Growth Equity Fund"** added to the platform.', time: '5 days ago' }
    ];

    activityListElement.innerHTML = ''; // Clear placeholders
    activities.forEach((activity, index) => {
        const activityItem = document.createElement('div');
        activityItem.classList.add('activity-item');
        activityItem.style.animationDelay = `${index * 0.15 + 1.5}s`; // Stagger animation after typing effect
        activityItem.innerHTML = `
            <span class="activity-icon">${activity.icon}</span> ${activity.text}
            <span class="activity-time">${activity.time}</span>
        `;
        activityListElement.appendChild(activityItem);
    });
}

/**
 * Populates the Matches Overview section with mock data and animations.
 */
function populateMatchesOverview(apiResponseData) {
    if (!apiResponseData || !apiResponseData.success || !apiResponseData.matches) {
        console.error("Invalid API response data provided to populateMatchesOverview:", apiResponseData);
        // Optionally display an error message to the user
        return;
    }

    const matches = apiResponseData.matches;
    const totalMatches = apiResponseData.total_matches;
    const highestScore = matches.length > 0 ? matches[0].score : 0; // Matches are sorted by score in Flask

    // Animate numbers
    animateNumber(totalUniqueMatchesElement, 0, totalMatches, 1000);
    animateNumber(highestMatchScoreElement, 0, highestScore, 1200);
    // For newMatchesWeekElement, you might need actual data from your backend
    // For now, it could be a fixed value or removed if not supported by the API
    animateNumber(newMatchesWeekElement, 0, 3, 1500); // Keeping mock for now, adjust as needed

    // Type out welcome messages
    typeText(matchesOverviewTitle, "Your Investor Matches", 40);
    setTimeout(() => {
        typeText(matchesOverviewSubtitle, "Explore your potential funding partners.", 30);
    }, 1000);

    topMatchesListElement.innerHTML = ''; // Clear existing content

    // Populate top 3 matches from the API response
    // The Flask backend already sorts by score and returns top matches.
    // We'll iterate over the 'matches' array from the response.
    matches.slice(0, 3).forEach((match, index) => { // Take only the top 3 or fewer if less are returned
        const investor = match.investor; // Access the nested investor object
        const score = match.score;
        const reasons = match.match_reasons;

        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card', 'animate-pop');
        matchCard.style.animationDelay = `${index * 0.15 + 1.5}s`; // Stagger animation

        matchCard.innerHTML = `
            <div class="match-header">
                <div class="investor-name">${investor.name}</div>
                <div class="match-score">${score}/7 Match</div>
            </div>
            <p style="color: var(--text-light); margin-bottom: 0.5rem; font-size: 0.9rem;">
                ${investor.description}
            </p>
            <div style="margin-top: 0.5rem;">
                <small style="color: var(--text-light);">
                    Investment Range: $${investor.investment_range[0].toLocaleString()} - $${investor.investment_range[1].toLocaleString()}
                    | Risk: ${investor.risk_tolerance.charAt(0).toUpperCase() + investor.risk_tolerance.slice(1)}
                </small>
            </div>
            ${reasons && reasons.length > 0 ? `
            <div class="match-reasons-list" style="margin-top: 0.5rem;">
                <h4 style="margin-bottom: 0.2rem; font-size: 0.85rem; color: var(--accent-color);">Match Reasons:</h4>
                <ul style="list-style-type: disc; padding-left: 1.2em; font-size: 0.8rem; color: var(--text-light);">
                    ${reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
        topMatchesListElement.appendChild(matchCard);
    });

    // If there are no matches, display a message
    if (matches.length === 0) {
        topMatchesListElement.innerHTML = '<p style="text-align: center; color: var(--text-light); margin-top: 2rem;">No matches found based on your profile. Try adjusting your preferences!</p>';
    }
}

/**
 * Populates the Messages section with mock data and animations.
 */
async function populateMessages() {
    typeText(messagesTitle, "Your Conversations", 40);
    setTimeout(() => {
        typeText(messagesSubtitle, "Stay connected with investors and partners.", 30);
    }, 1000);

    messageListElement.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">Loading messages...</div>'; // Loading indicator
    
    try {
        const responseData = await apiCall('/api/messages', {
            method: 'GET' // Use GET method for retrieving messages
        });


        

        console.log("Messages API Response:", responseData);

        if (responseData && responseData.success && responseData.messages) {
            const messages = responseData.messages;
            messageListElement.innerHTML = ''; // Clear loading indicator

            messages.forEach((msg, index) => {
                const messageItem = document.createElement('div');
                messageItem.classList.add('message-item', msg.sender);
                messageItem.style.animationDelay = `${index * 0.1}s`; // Stagger animation

                const avatarDiv = document.createElement('div');
                avatarDiv.classList.add('message-avatar');
                // Ensure characterAvatars is defined and has 'founder' and 'investor' keys
                if (characterAvatars && characterAvatars[msg.sender]) {
                    avatarDiv.style.backgroundColor = characterAvatars[msg.sender].color;
                    avatarDiv.textContent = characterAvatars[msg.sender].icon;
                } else {
                    // Fallback if avatar data is missing
                    avatarDiv.style.backgroundColor = '#ccc';
                    avatarDiv.textContent = msg.sender === 'founder' ? 'F' : 'I';
                }


                const contentDiv = document.createElement('div');
                contentDiv.classList.add('message-content');
                contentDiv.innerHTML = `
                    ${msg.content}
                    <span class="message-timestamp">${msg.timestamp}</span>
                `;

                messageItem.appendChild(avatarDiv);
                messageItem.appendChild(contentDiv);
                messageListElement.appendChild(messageItem);
            });

            // Scroll to the bottom of the message list after populating
            messageListElement.scrollTop = messageListElement.scrollHeight;

            if (messages.length === 0) {
                messageListElement.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">No messages yet. Start a conversation!</div>';
            }

        } else {
            console.error("API returned an error or unexpected structure for messages:", responseData);
            messageListElement.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--error-color);">Failed to load messages. Please try again.</div>';
        }

    } catch (error) {
        console.error('Error fetching messages:', error);
        messageListElement.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--error-color);">Unable to connect to the message service.</div>';
    }
}


/**
 * Sends a mock message and appends it to the message list.
 */
async function sendMessage(sender, content) {
    // Trim whitespace from the message content
    if (!content.trim()) {
        console.warn("Cannot send empty message.");
        return; // Do not proceed if the message is empty or just whitespace
    }

    try {
        // Add a temporary message to the UI immediately for better user experience (optimistic update)
        // This makes the UI feel more responsive while waiting for the API call.
        const tempMessageItem = document.createElement('div');
        tempMessageItem.classList.add('message-item', sender, 'sending'); // 'sending' class can be used for styling (e.g., lighter color)
        tempMessageItem.innerHTML = `
            <div class="message-avatar" style="background-color: ${characterAvatars[sender].color};">${characterAvatars[sender].icon}</div>
            <div class="message-content">${content}<span class="message-timestamp">Sending...</span></div>
        `;
        messageListElement.appendChild(tempMessageItem);
        // Scroll to the bottom to show the new message
        messageListElement.scrollTop = messageListElement.scrollHeight;

        // Make the API call to send the message to your Flask backend
        const responseData = await apiCall('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sender: sender, content: content }) // Send sender and content
        });

        console.log("Send Message API Response:", responseData);

        // Check if the message was successfully stored in the database
        if (responseData && responseData.success) {
            console.log("Message sent successfully!");
            // Remove the temporary message. We will re-fetch all messages to ensure
            // the server-generated timestamp is displayed correctly and the message
            // is in its final sorted position.
            messageListElement.removeChild(tempMessageItem);
            populateMessages(); // Re-fetch all messages to update the chat UI
            if (messageInput) messageInput.value = ''; // Clear the input field after sending
        } else {
            console.error("API returned an error when sending message:", responseData.error);
            // Update the temporary message to indicate an error
            tempMessageItem.classList.remove('sending');
            tempMessageItem.classList.add('error'); // Add an 'error' class for visual feedback
            tempMessageItem.querySelector('.message-timestamp').textContent = 'Failed to send';
            // Optionally, display a more prominent user-facing error message
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Handle network errors or other exceptions during the API call
        if (tempMessageItem) {
            tempMessageItem.classList.remove('sending');
            tempMessageItem.classList.add('error');
            tempMessageItem.querySelector('.message-timestamp').textContent = 'Network Error';
        }
        // Optionally, display a general error message to the user
    }
}


// --- Navigation & Form Handling ---
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('fade-in'); // Remove to re-trigger animation
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        // Trigger reflow to restart animation
        void targetSection.offsetWidth; 
        targetSection.classList.add('fade-in');
    }

    // Update active navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    if (sectionId === 'dashboard-section') {
        navDashboard.classList.add('active');
        populateDashboard(); // Re-populate dashboard when shown
    } else if (sectionId === 'profile-step' || sectionId === 'loading-state') {
        navProfile.classList.add('active');
    } else if (sectionId === 'results-section') {
        navProfile.classList.add('active'); // Still part of the profile/matching flow
    } else if (sectionId === 'matches-overview-section') {
        navMatches.classList.add('active');
        populateMatchesOverview(); // Populate matches overview when shown
    } else if (sectionId === 'messages-section') {
        navMessages.classList.add('active');
        populateMessages(); // Populate messages when shown
    }
}

function resetForm() {
    profileForm.reset();
    document.querySelectorAll('.form-input, .form-select').forEach(element => {
        element.style.borderColor = 'var(--border-light)'; // Reset border color
    });
    showSection('profile-step'); // Go back to the profile form
}

// Initial display on page load
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard-section'); // Show dashboard by default
});

// Event Listeners
profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    showSection('loading-state'); // Show loading state
    typeText(loadingTextElement, "Finding your perfect investor matches...", 40);

    const founderProfile = {
        industry: document.getElementById('industry').value,
        // Corrected keys to match the snake_case expected by the Flask backend
        funding_stage: document.getElementById('funding-stage').value,
        risk_tolerance: document.getElementById('risk-tolerance').value,
        investment_amount: document.getElementById('investment-amount').value,
        company_name: document.getElementById('company-name').value // Optional, but good to keep consistent
    };

    console.log("Attempting to submit founder profile and get matches...");
    console.log("Founder Profile Data:", founderProfile);

    try {
        const responseData = await apiCall('/api/match', { // Renamed 'response' to 'responseData' for clarity
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(founderProfile)
        });

        console.log("API Call Successful. Received Response Data:", responseData);

        // Check if the API response explicitly indicates success
        if (responseData && responseData.success) {
            console.log("API response indicates success. Populating matches overview and displaying detailed matches...");
            populateMatchesOverview(responseData); // Populate the overview section
            displayMatches(responseData.matches, founderProfile); // Display detailed matches
            // Assuming you have an element to display general error messages, hide it on success
            // document.getElementById('errorMessageDisplay').style.display = 'none';
        } else {
            // This block will be hit if responseData.success is false or undefined
            console.error("API returned a successful HTTP status (200 OK) but indicated a logical error or unexpected structure.");
            console.error("Response success status:", responseData ? responseData.success : "undefined");
            console.error("Response error message:", responseData ? responseData.error : "N/A");

            // Display the specific error message from the backend if available,
            // otherwise, use a generic one.
            const errorMessage = responseData && responseData.error ?
                                 `Matching service error: ${responseData.error}` :
                                 "Unable to retrieve matches. Please check your input.";
            displayError(errorMessage); // Use your existing displayError function
            console.warn(errorMessage); // Log to console for debugging
        }

    } catch (error) {
        // This catch block handles network errors or errors thrown by apiCall itself
        console.error("Error during API call or processing response:", error);
        const errorMessage = `Failed to connect to the matching service: ${error.message}. Please try again later.`;
        displayError(errorMessage); // Use your existing displayError function
        console.warn(errorMessage); // Log to console for debugging
    }

    showSection('results-section'); // Show results section regardless of success/failure (you might want to adjust this based on error handling)
});

// Navigation clicks
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('dashboard-section');
});

navProfile.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm(); // Ensure form is reset when navigating to profile
});

navMatches.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('matches-overview-section');
});

navMessages.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('messages-section');
});

startNewMatchButton.addEventListener('click', () => {
    resetForm();
});

viewAllMatchesButton.addEventListener('click', () => {
    showSection('results-section');
});


document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message-btn');
    // Ensure messageListElement is also correctly referenced if not global
    // const messageListElement = document.getElementById('message-list');

    if (sendMessageButton && messageInput) {
        sendMessageButton.addEventListener('click', () => {
            const messageContent = messageInput.value;
            // Determine the current sender. In a real app, this would come from
            // user authentication state (e.g., if a founder is logged in, sender is 'founder').
            // For this example, let's assume the user is a 'founder'.
            const currentSender = 'founder'; // You might make this dynamic based on user role
            sendMessage(currentSender, messageContent);
        });
    }

    // Allow sending messages by pressing Enter in the input field
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if input is inside a form
                const messageContent = messageInput.value;
                const currentSender = 'founder'; // Same as above
                sendMessage(currentSender, messageContent);
            }
        });
    }
});


// Add form validation feedback
document.querySelectorAll('.form-input, .form-select').forEach(element => {
    element.addEventListener('invalid', function() {
        this.style.borderColor = '#E74C3C'; // Red border for invalid
    });
    
    element.addEventListener('input', function() {
        if (this.checkValidity()) {
            this.style.borderColor = '#27AE60'; // Green border for valid
        } else {
            this.style.borderColor = 'var(--border-light)'; // Default if not valid
        }
    });
});
