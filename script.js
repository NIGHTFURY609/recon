// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // This is a placeholder for your actual backend API

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
        // Simulate API call delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500)); // 0.8 to 1.3 seconds delay

        // This is where you would typically make a real fetch call
        // const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options });
        // if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        // return await response.json();

        // --- Mock Data for Demonstration ---
        if (endpoint === '/match' && options.method === 'POST') {
            const founderProfile = JSON.parse(options.body);
            const mockInvestors = [
                {
                    name: "Tech Growth Ventures",
                    description: "Specializes in early-stage SaaS and AI startups, focusing on disruptive technologies and scalable solutions.",
                    investment_range: [500000, 5000000],
                    risk_tolerance: "high",
                    location: "Silicon Valley",
                    contact: "contact@techgrowth.com"
                },
                {
                    name: "Health Innovation Fund",
                    description: "Invests in innovative HealthTech solutions, digital health platforms, and biotech advancements.",
                    investment_range: [200000, 3000000],
                    risk_tolerance: "medium",
                    location: "Boston",
                    contact: "info@healthinnov.com"
                },
                {
                    name: "EduFuture Capital",
                    description: "Dedicated to transforming education through EdTech startups with scalable models and impactful learning tools.",
                    investment_range: [100000, 2000000],
                    risk_tolerance: "medium",
                    location: "New York",
                    contact: "partners@edufuture.com"
                },
                {
                    name: "Global Fintech Partners",
                    description: "A leading fund for FinTech startups, from payment solutions and blockchain to regulatory tech.",
                    investment_range: [1000000, 10000000],
                    risk_tolerance: "high",
                    location: "London",
                    contact: "invest@globalfintech.com"
                },
                {
                    name: "E-commerce Accelerators",
                    description: "Focuses on direct-to-consumer (D2C) brands, e-commerce innovations, and logistics technology.",
                    investment_range: [50000, 1000000],
                    risk_tolerance: "low",
                    location: "Los Angeles",
                    contact: "accelerate@ecommerce.com"
                },
                 {
                    name: "AI Frontier Fund",
                    description: "Exclusively invests in cutting-edge AI and Machine Learning applications across various sectors.",
                    investment_range: [750000, 7000000],
                    risk_tolerance: "high",
                    location: "Seattle",
                    contact: "ai@frontier.com"
                },
                {
                    name: "Blockchain Innovators",
                    description: "Supports decentralized applications, crypto infrastructure, and blockchain-native businesses.",
                    investment_range: [300000, 4000000],
                    risk_tolerance: "high",
                    location: "Zug, Switzerland",
                    contact: "contact@blockchaininnov.com"
                }
            ];

            const matches = mockInvestors.map(investor => {
                let score = 0;
                const reasons = [];

                // Industry match
                if (investor.description.toLowerCase().includes(founderProfile.industry.toLowerCase()) || 
                    investor.name.toLowerCase().includes(founderProfile.industry.toLowerCase())) {
                    score += 2;
                    reasons.push(`Invests in your industry: **${founderProfile.industry.charAt(0).toUpperCase() + founderProfile.industry.slice(1)}**`);
                }

                // Funding stage match (simplified)
                const investmentAmount = parseInt(founderProfile.investmentAmount);
                if (investor.investment_range[0] <= investmentAmount && investor.investment_range[1] >= investmentAmount) {
                    score += 2;
                    reasons.push(`Investment range aligns: $${investor.investment_range[0].toLocaleString()} - $${investor.investment_range[1].toLocaleString()}`);
                } else if (investor.investment_range[0] < investmentAmount * 1.5 && investor.investment_range[1] > investmentAmount * 0.5) {
                    score += 1; // Partial match
                    reasons.push(`Investment range is a close fit`);
                }

                // Risk tolerance match
                if (investor.risk_tolerance === founderProfile.riskTolerance) {
                    score += 1;
                    reasons.push(`Matches your risk tolerance: **${founderProfile.riskTolerance.charAt(0).toUpperCase() + founderProfile.riskTolerance.slice(1)}**`);
                }

                // Company name keyword match (example - very basic)
                if (founderProfile.companyName.toLowerCase().includes("ai") && investor.name.toLowerCase().includes("ai")) {
                     score += 1;
                     reasons.push(`Interest in AI-driven companies`);
                }
                if (founderProfile.companyName.toLowerCase().includes("health") && investor.name.toLowerCase().includes("health")) {
                     score += 1;
                     reasons.push(`Interest in Health-related companies`);
                }

                // Add a random bonus point for variety
                if (Math.random() > 0.6) { // Increased chance for bonus
                    score += 1;
                    reasons.push("Strong general alignment with innovative startups");
                }

                return {
                    investor: investor,
                    score: Math.min(score, 7), // Max score of 7
                    match_reasons: reasons.length > 0 ? reasons : ["General interest in promising startups"]
                };
            }).filter(match => match.score >= 3) // Only show matches with a reasonable score
              .sort((a, b) => b.score - a.score); // Sort by highest score first

            return { success: true, matches: matches };
        }
        return { success: false, error: "Mock API endpoint not found." };
        // --- End Mock Data ---

    } catch (error) {
        console.error('API call failed:', error);
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
function populateMatchesOverview() {
    // Animate numbers
    animateNumber(totalUniqueMatchesElement, 0, 15, 1000);
    animateNumber(highestMatchScoreElement, 0, 7, 1200);
    animateNumber(newMatchesWeekElement, 0, 3, 1500);

    // Type out welcome messages
    typeText(matchesOverviewTitle, "Your Investor Matches", 40);
    setTimeout(() => {
        typeText(matchesOverviewSubtitle, "Explore your potential funding partners.", 30);
    }, 1000);

    // Populate top 3 matches (reusing mock data from findMatches for consistency)
    const mockInvestorsForOverview = [
        {
            name: "Tech Growth Ventures",
            description: "Specializes in early-stage SaaS and AI startups.",
            investment_range: [500000, 5000000],
            risk_tolerance: "high",
            location: "Silicon Valley",
            contact: "contact@techgrowth.com",
            score: 7, // Mock score for overview
            match_reasons: ["Perfect industry fit", "High investment potential"]
        },
        {
            name: "Global Fintech Partners",
            description: "A leading fund for FinTech startups.",
            investment_range: [1000000, 10000000],
            risk_tolerance: "high",
            location: "London",
            contact: "invest@globalfintech.com",
            score: 6,
            match_reasons: ["Strong financial sector focus", "Large investment capacity"]
        },
        {
            name: "Health Innovation Fund",
            description: "Invests in innovative HealthTech solutions.",
            investment_range: [200000, 3000000],
            risk_tolerance: "medium",
            location: "Boston",
            contact: "info@healthinnov.com",
            score: 5,
            match_reasons: ["Aligned with health sector trends", "Supportive ecosystem"]
        }
    ];

    topMatchesListElement.innerHTML = ''; // Clear placeholders
    mockInvestorsForOverview.forEach((investor, index) => {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card', 'animate-pop');
        matchCard.style.animationDelay = `${index * 0.15 + 1.5}s`; // Stagger animation
        
        matchCard.innerHTML = `
            <div class="match-header">
                <div class="investor-name">${investor.name}</div>
                <div class="match-score">${investor.score}/7 Match</div>
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
        `;
        topMatchesListElement.appendChild(matchCard);
    });
}

/**
 * Populates the Messages section with mock data and animations.
 */
function populateMessages() {
    typeText(messagesTitle, "Your Conversations", 40);
    setTimeout(() => {
        typeText(messagesSubtitle, "Stay connected with investors and partners.", 30);
    }, 1000);

    const mockMessages = [
        { sender: 'investor', content: 'Greetings, Founder! We\'ve been analyzing your pitch deck. Your project looks quite intriguing!', timestamp: '10:30 AM' },
        { sender: 'founder', content: 'That\'s fantastic to hear! I\'m thrilled you found it interesting. What aspects caught your eye?', timestamp: '10:35 AM' },
        { sender: 'investor', content: 'The innovative use of blockchain in your supply chain solution is particularly compelling. We see great potential there.', timestamp: 'Yesterday, 09:00 AM' },
        { sender: 'founder', content: 'Indeed! We believe it offers unparalleled transparency and efficiency. Would you be open to a brief virtual meeting to discuss the tech in more detail?', timestamp: 'Yesterday, 09:15 AM' },
        { sender: 'investor', content: 'Affirmative! Our calendar is open next Tuesday. How about 2 PM PST? This could be a fruitful alliance.', timestamp: 'Yesterday, 09:20 AM' },
    ];

    messageListElement.innerHTML = ''; // Clear existing messages
    mockMessages.forEach((msg, index) => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-item', msg.sender);
        messageItem.style.animationDelay = `${index * 0.1}s`; // Stagger animation

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        avatarDiv.style.backgroundColor = characterAvatars[msg.sender].color;
        avatarDiv.textContent = characterAvatars[msg.sender].icon;

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
}

/**
 * Sends a mock message and appends it to the message list.
 */
function sendMessage() {
    const messageContent = messageInput.value.trim();
    if (messageContent === '') return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item', 'sent');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');
    avatarDiv.style.backgroundColor = characterAvatars['founder'].color;
    avatarDiv.textContent = characterAvatars['founder'].icon;

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = `
        ${messageContent}
        <span class="message-timestamp">${timeString}</span>
    `;

    messageItem.appendChild(avatarDiv);
    messageItem.appendChild(contentDiv);
    messageListElement.appendChild(messageItem);
    messageInput.value = ''; // Clear input

    // Scroll to the bottom
    messageListElement.scrollTop = messageListElement.scrollHeight;

    // Simulate a reply after a short delay
    typingIndicator.style.display = 'flex'; // Show typing indicator
    messageListElement.scrollTop = messageListElement.scrollHeight; // Scroll to show indicator

    setTimeout(() => {
        typingIndicator.style.display = 'none'; // Hide typing indicator
        const replyItem = document.createElement('div');
        replyItem.classList.add('message-item', 'received');
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const randomReplies = [
            "Understood. We'll process your query and respond shortly.",
            "Acknowledged. Our team is reviewing this now.",
            "Affirmative. Awaiting further data for comprehensive response.",
            "Message received. Calculating optimal next step."
        ];
        const replyContent = randomReplies[Math.floor(Math.random() * randomReplies.length)];

        const replyAvatarDiv = document.createElement('div');
        replyAvatarDiv.classList.add('message-avatar');
        replyAvatarDiv.style.backgroundColor = characterAvatars['investor'].color;
        replyAvatarDiv.textContent = characterAvatars['investor'].icon;

        const replyContentDiv = document.createElement('div');
        replyContentDiv.classList.add('message-content');
        replyContentDiv.innerHTML = `
            ${replyContent}
            <span class="message-timestamp">${replyTime}</span>
        `;
        
        replyItem.appendChild(replyAvatarDiv);
        replyItem.appendChild(replyContentDiv);
        messageListElement.appendChild(replyItem);
        messageListElement.scrollTop = messageListElement.scrollHeight;
    }, 2000 + Math.random() * 1000); // Reply after 2-3 seconds
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
        fundingStage: document.getElementById('funding-stage').value,
        riskTolerance: document.getElementById('risk-tolerance').value,
        investmentAmount: document.getElementById('investment-amount').value,
        companyName: document.getElementById('company-name').value
    };

    try {
        const response = await apiCall('/match', {
            method: 'POST',
            body: JSON.stringify(founderProfile)
        });
        
        if (response.success) {
            displayMatches(response.matches, founderProfile);
        } else {
            displayError(response.error || 'Failed to find matches');
        }
        
    } catch (error) {
        console.error('Error finding matches:', error);
        displayError('Unable to connect to the matching service. Please try again later.');
    }
    
    showSection('results-section'); // Show results
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

sendMessageBtn.addEventListener('click', sendMessage); // Event listener for send button
messageInput.addEventListener('keypress', (e) => { // Send message on Enter key
    if (e.key === 'Enter') {
        sendMessage();
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