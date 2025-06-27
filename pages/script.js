document.addEventListener('DOMContentLoaded', () => {
    const questionCard = document.getElementById('question-card');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const questionCounter = document.getElementById('question-counter');
    const skipBtn = document.getElementById('skip-btn');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const resultsOverlay = document.getElementById('results-overlay');
    const personaSummary = document.getElementById('persona-summary');
    const backToFundMatchBtn = document.getElementById('back-to-fundmatch');

    let currentQuestionIndex = 0;
    let userAnswers = {}; // Store user's selected options for each question
    let questionHistory = []; // To track visited questions for 'Back' button

    const questions = [
        {
            id: 'q1_stage',
            question: "What's your startup's current funding stage?",
            options: [
                { text: "Pre-Seed / Idea Stage", value: "pre-seed", preference: { fundingStage: "pre-seed", riskTolerance: "high" } },
                { text: "Seed / Early Traction", value: "seed", preference: { fundingStage: "seed", riskTolerance: "medium" } },
                { text: "Series A / Growth", value: "series-a", preference: { fundingStage: "series-a", riskTolerance: "low" } },
                { text: "Series B+ / Scale-up", value: "series-b", preference: { fundingStage: "series-b", riskTolerance: "low" } }
            ],
            type: 'single-choice'
        },
        {
            id: 'q2_industry',
            question: "Which industry best describes your startup?",
            options: [
                { text: "FinTech", value: "fintech", preference: { industry: "fintech" } },
                { text: "HealthTech", value: "healthtech", preference: { industry: "healthtech" } },
                { text: "EdTech", value: "edtech", preference: { industry: "edtech" } },
                { text: "SaaS", value: "saas", preference: { industry: "saas" } },
                { text: "E-commerce", value: "ecommerce", preference: { industry: "ecommerce" } },
                { text: "AI/ML", value: "ai", preference: { industry: "ai" } },
                { text: "Blockchain", value: "blockchain", preference: { industry: "blockchain" } },
                { text: "IoT", value: "iot", preference: { industry: "iot" } }
            ],
            type: 'single-choice'
        },
        {
            id: 'q3_involvement',
            question: "Do you prefer investors who are hands-on or hands-off?",
            options: [
                { text: "Hands-on (mentorship, active guidance)", value: "hands-on", preference: { investorInvolvement: "active" } },
                { text: "Hands-off (capital only, minimal interference)", value: "hands-off", preference: { investorInvolvement: "passive" } },
                { text: "Balanced approach", value: "balanced", preference: { investorInvolvement: "balanced" } }
            ],
            type: 'single-choice'
        },
        {
            id: 'q4_growth',
            question: "What's your primary growth ambition?",
            options: [
                { text: "Rapid, aggressive scaling", value: "aggressive", preference: { growthAmbition: "aggressive", riskTolerance: "high" } },
                { text: "Steady, sustainable growth", value: "sustainable", preference: { growthAmbition: "sustainable", riskTolerance: "medium" } },
                { text: "Niche market dominance", value: "niche", preference: { growthAmbition: "niche", riskTolerance: "low" } }
            ],
            type: 'single-choice'
        },
        {
            id: 'q5_location',
            question: "Are you open to investors from any geographical location?",
            options: [
                { text: "Yes, global investors are welcome", value: "global", preference: { geographicPreference: "global" } },
                { text: "Prefer local/regional investors", value: "local", preference: { geographicPreference: "local" } },
                { text: "Specific regions only (e.g., EU, APAC)", value: "specific", preference: { geographicPreference: "specific" } }
            ],
            type: 'single-choice'
        }
    ];

    function displayQuestion(index) {
        if (index < 0 || index >= questions.length) {
            showResults();
            return;
        }

        const currentQuestion = questions[index];
        questionText.textContent = currentQuestion.question;
        optionsContainer.innerHTML = ''; // Clear previous options

        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option.text;
            button.dataset.value = option.value;
            button.dataset.id = currentQuestion.id;

            // If this question was previously answered, highlight the selected option
            if (userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id].value === option.value) {
                button.classList.add('selected');
            }

            button.addEventListener('click', () => selectOption(currentQuestion.id, option.value, option.preference));
            optionsContainer.appendChild(button);
        });

        // Animate card entry
        questionCard.classList.remove('exit-left', 'exit-right', 'active');
        void questionCard.offsetWidth; // Trigger reflow
        questionCard.classList.add('active');

        updateProgressBar();
        updateNavigationButtons();
    }

    function selectOption(questionId, value, preference) {
        // Deselect any previously selected option for this question
        const prevSelected = optionsContainer.querySelector('.option-btn.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Select the new option
        const newSelected = optionsContainer.querySelector(`[data-value="${value}"]`);
        if (newSelected) {
            newSelected.classList.add('selected');
        }

        // Store the answer
        userAnswers[questionId] = { value, preference };

        // Automatically move to the next question after a short delay
        setTimeout(() => {
            questionCard.classList.add('exit-right'); // Animate current card out
            questionCard.addEventListener('animationend', () => {
                questionCard.classList.remove('exit-right', 'active');
                if (currentQuestionIndex === questionHistory.length - 1) { // If moving forward
                    questionHistory.push(currentQuestionIndex + 1);
                }
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
            }, { once: true });
        }, 300); // Short delay for visual feedback
    }

    function updateProgressBar() {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBarFill.style.width = `${progress}%`;
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    }

    function updateNavigationButtons() {
        backBtn.style.display = currentQuestionIndex > 0 ? 'flex' : 'none';
        nextBtn.style.display = 'none'; // Hide next button for auto-advance
        skipBtn.style.display = currentQuestionIndex < questions.length ? 'flex' : 'none';
    }

    function showResults() {
        resultsOverlay.style.display = 'flex';
        void resultsOverlay.offsetWidth; // Trigger reflow
        resultsOverlay.classList.add('active');

        let persona = {
            fundingStage: [],
            industry: [],
            riskTolerance: [],
            investorInvolvement: [],
            growthAmbition: [],
            geographicPreference: []
        };

        // Aggregate preferences from user answers
        for (const qId in userAnswers) {
            const answer = userAnswers[qId];
            if (answer && answer.preference) {
                for (const key in answer.preference) {
                    if (persona[key]) {
                        persona[key].push(answer.preference[key]);
                    }
                }
            }
        }

        // Generate summary text
        let summaryHtml = '<p>Based on your responses, here\'s a summary of your ideal investor persona:</p><ul>';

        if (persona.fundingStage.length > 0) {
            summaryHtml += `<li><strong>Funding Stage:</strong> ${Array.from(new Set(persona.fundingStage)).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</li>`;
        }
        if (persona.industry.length > 0) {
            summaryHtml += `<li><strong>Preferred Industries:</strong> ${Array.from(new Set(persona.industry)).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}</li>`;
        }
        if (persona.riskTolerance.length > 0) {
            summaryHtml += `<li><strong>Risk Tolerance:</strong> ${Array.from(new Set(persona.riskTolerance)).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}</li>`;
        }
        if (persona.investorInvolvement.length > 0) {
            summaryHtml += `<li><strong>Investor Involvement:</strong> ${Array.from(new Set(persona.investorInvolvement)).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}</li>`;
        }
        if (persona.growthAmbition.length > 0) {
            summaryHtml += `<li><strong>Growth Ambition:</strong> ${Array.from(new Set(persona.growthAmbition)).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</li>`;
        }
        if (persona.geographicPreference.length > 0) {
            summaryHtml += `<li><strong>Geographic Preference:</strong> ${Array.from(new Set(persona.geographicPreference)).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</li>`;
        }

        summaryHtml += '</ul><p>This profile will help us find the best matches for you!</p>';
        personaSummary.innerHTML = summaryHtml;
    }

    // Event Listeners for Navigation Buttons
    skipBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length) {
            questionCard.classList.add('exit-left'); // Animate current card out
            questionCard.addEventListener('animationend', () => {
                questionCard.classList.remove('exit-left', 'active');
                if (currentQuestionIndex === questionHistory.length - 1) { // If moving forward
                    questionHistory.push(currentQuestionIndex + 1);
                }
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
            }, { once: true });
        } else {
            showResults();
        }
    });

    backBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            questionCard.classList.add('exit-right'); // Animate current card out to the right
            questionCard.addEventListener('animationend', () => {
                questionCard.classList.remove('exit-right', 'active');
                currentQuestionIndex--;
                questionHistory.pop(); // Remove current from history
                displayQuestion(currentQuestionIndex);
            }, { once: true });
        }
    });

    // This button is hidden for auto-advance, but keeping the function for potential future use
    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length) {
            questionCard.classList.add('exit-right'); // Animate current card out
            questionCard.addEventListener('animationend', () => {
                questionCard.classList.remove('exit-right', 'active');
                if (currentQuestionIndex === questionHistory.length - 1) { // If moving forward
                    questionHistory.push(currentQuestionIndex + 1);
                }
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
            }, { once: true });
        } else {
            showResults();
        }
    });

    backToFundMatchBtn.addEventListener('click', () => {
        // In a real application, you'd pass `userAnswers` back to the main app.
        // For this demo, we'll simulate redirecting to the main dashboard.
        // You could use localStorage or URL parameters to pass data.
        // Example with URL parameters:
        // const params = new URLSearchParams();
        // for (const qId in userAnswers) {
        //     params.append(qId, userAnswers[qId].value);
        // }
        // window.location.href = `index.html?${params.toString()}#profile-step`;

        window.location.href = 'index.html#dashboard-section'; // Redirect to main dashboard
    });

    // Initial display
    questionHistory.push(currentQuestionIndex);
    displayQuestion(currentQuestionIndex);
});
