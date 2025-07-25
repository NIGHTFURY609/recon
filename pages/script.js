

 API_BASE_URL = "https://recon-xh9b.onrender.com"; // This comes from your Flask backend



document.addEventListener('DOMContentLoaded', () => {
    //DOM Element References
    const reconatorContainer = document.querySelector('.reconator-container');
    const questionCard = document.getElementById('question-card');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const sidebarProgressBarFill = document.getElementById('sidebar-progress-bar-fill');
    const sidebarQuestionCounter = document.getElementById('sidebar-question-counter');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const yourMatchBtn = document.getElementById('your-match-btn');
    const resultsOverlay = document.getElementById('results-overlay');
    const personaSummary = document.getElementById('persona-summary');
    const backToFundMatchBtn = document.getElementById('back-to-fundmatch');
    const minQuestionsMessage = document.getElementById('min-questions-message');
    const actionButtonsContainer = document.getElementById('action-buttons');
    const sidebarQuestionList = document.getElementById('sidebar-question-list');
    
    //State Variables
    let currentQuestionIndex = 0;
    let userAnswers = {}; // Stores answers in { questionId: selectedValue } format
    let questionHistory = []; // To manage back button navigation
    const MIN_QUESTIONS_FOR_MATCH = 7; // Minimum questions required to enable "Your Match" button
    const MAX_QUESTIONS = 10; // Total number of questions

    //Quiz Questions Data
    const questions = [
        {
            id:"question_id_1",
            question: "What's your startup's current funding stage?",
            options: [
                { text: "Pre-Seed / Idea Stage", value: "pre-seed", preference: { fundingStage: "pre-seed", riskTolerance: "high" } },
                { text: "Seed / Early Traction", value: "seed", preference: { fundingStage: "seed", riskTolerance: "medium" } },
                { text: "Series A / Growth", value: "series-a", preference: { fundingStage: "series-a", riskTolerance: "low" } },
                { text: "Series B+ / Scale-up", value: "series-b", preference: { fundingStage: "series-b", riskTolerance: "low" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_2",
            question: "Which industry best describes your startup?",
            options: [
                { text: "FinTech", value: "fintech", preference: { industry: "fintech" } },
                { text: "HealthTech", value: "healthtech", preference: { industry: "healthtech" } },
                { text: "EdTech", value: "edtech", preference: { industry: "edtech" } },
                { text: "SaaS", value: "saas", preference: { industry: "saas" } },
                { text: "E-commerce", value: "ecommerce", preference: { industry: "ecommerce" } },
                { text: "AI/ML", value: "ai", preference: { industry: "ai" } },
                { text: "Blockchain", value: "blockchain", preference: { industry: "blockchain" } },
                { text: "IoT", value: "iot", preference: { industry: "iot" } },
                { text: "CleanTech", value: "cleantech", preference: { industry: "cleantech" } },
                { text: "BioTech", value: "biotech", preference: { industry: "biotech" } },
                { text: "Gaming", value: "gaming", preference: { industry: "gaming" } }
            ],
            type: 'single-choice',
            scrollable: true
        },
        {
            id: "question_id_3",
            question: "How hands-on do you prefer your investors to be?",
            options: [
                { text: "Very involved (mentorship, active board role)", value: "active", preference: { investorInvolvement: "active" } },
                { text: "Moderately involved (strategic advice, connections)", value: "balanced", preference: { investorInvolvement: "balanced" } },
                { text: "Hands-off (capital only, minimal interference)", value: "passive", preference: { investorInvolvement: "passive" } },
                { text: "Accelerator/Incubator program", value: "accelerator", preference: { investorInvolvement: "active" } },
                { text: "Angel investor with domain expertise", value: "angel", preference: { investorInvolvement: "balanced" } },
                { text: "Venture Capital (VC) firm", value: "vc", preference: { investorInvolvement: "balanced" } }
            ],
            type: 'single-choice',
            scrollable: true
        },
        {
            id: "question_id_4",
            question: "What's your long-term vision for your startup's exit?",
            options: [
                { text: "Acquisition by a larger company", value: "acquisition", preference: { exitStrategy: "acquisition" } },
                { text: "Initial Public Offering (IPO)", value: "ipo", preference: { exitStrategy: "ipo" } },
                { text: "Sustainable, long-term private company", "value": "private", preference: { exitStrategy: "private" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_5",
            question: "Which investor value aligns most with your company culture?",
            options: [
                { text: "Innovation & Disruption", value: "innovation", preference: { investorValues: "innovation" } },
                { text: "Social Impact & Sustainability", value: "social_impact", preference: { investorValues: "social_impact" } },
                { text: "Profitability & Market Dominance", value: "profitability", preference: { investorValues: "profitability" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_6",
            question: "Do you prefer investors with a specific geographic focus?",
            options: [
                { text: "No preference (global reach)", value: "global", preference: { geographicPreference: "global" } },
                { text: "North America", value: "north_america", preference: { geographicPreference: "north_america" } },
                { text: "Europe", value: "europe", preference: { geographicPreference: "europe" } },
                { text: "Asia-Pacific (APAC)", value: "apac", preference: { geographicPreference: "apac" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_7",
            question: "How quickly do you need to secure funding?",
            options: [
                { text: "Urgent (within 3 months)", value: "urgent", preference: { fundingSpeed: "urgent", riskTolerance: "high" } },
                { text: "Moderate (3-6 months)", value: "moderate", preference: { fundingSpeed: "moderate", riskTolerance: "medium" } },
                { text: "Flexible (6+ months)", value: "flexible", preference: { fundingSpeed: "flexible", riskTolerance: "low" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_8",
            question: "How important is an investor's network to you?",
            options: [
                { text: "Crucial (introductions, partnerships)", value: "crucial", preference: { networkAccess: "crucial", investorInvolvement: "active" } },
                { text: "Helpful (some connections are a bonus)", value: "helpful", preference: { networkAccess: "helpful", investorInvolvement: "balanced" } },
                { text: "Not a priority (focused on capital)", value: "not_priority", preference: { networkAccess: "not_priority", investorInvolvement: "passive" } }
            ],
            type: 'single-choice',
            scrollable: false
        },
        {
            id: "question_id_9",
            question: "What's your preferred deal structure?",
            options: [
                { text: "Equity (traditional ownership stake)", value: "equity", preference: { dealStructure: "equity" } },
                { text: "Convertible Note / SAFE (deferred equity)", value: "convertible", preference: { dealStructure: "convertible" } },
                { text: "Debt (loans, revenue-based financing)", value: "debt", preference: { dealStructure: "debt" } },
                { text: "Revenue Share", value: "revenue_share", preference: { dealStructure: "debt" } },
                { text: "Grant funding", value: "grant", preference: { dealStructure: "grant" } }
            ],
            type: 'single-choice',
            scrollable: true
        },
        {
            id: "question_id_10",
            question: "Are you open to an investor taking a board seat?",
            options: [
                { text: "Yes, if they add significant value", value: "yes_value_add", preference: { boardSeat: "yes", investorInvolvement: "active" } },
                { text: "Maybe, depends on the investor", value: "maybe", preference: { boardSeat: "maybe", investorInvolvement: "balanced" } },
                { text: "No, prefer to maintain full control", value: "no_control", preference: { boardSeat: "no", investorInvolvement: "passive" } }
            ],
            type: 'single-choice',
            scrollable: false
        }
    ];
    //Custom Modal for Messages (replaces alert())
    function showMessageModal(message) {
        let modal = document.getElementById('custom-message-modal');
        let modalText = document.getElementById('custom-message-text');
        let modalCloseBtn = document.getElementById('custom-message-close-btn');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-message-modal';
            modal.innerHTML = `
                <div class="custom-message-content">
                    <p id="custom-message-text"></p>
                    <button id="custom-message-close-btn">OK</button>
                </div>
            `;
            document.body.appendChild(modal);
            modalText = document.getElementById('custom-message-text');
            modalCloseBtn = document.getElementById('custom-message-close-btn');
        }

        modalText.textContent = message;
        modal.classList.add('show');

        const closeModal = () => {
            modal.classList.remove('show');
            modalCloseBtn.removeEventListener('click', closeModal);
            modal.removeEventListener('click', outsideClick);
        };

        const outsideClick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };

        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', outsideClick);
    }

    // Core Quiz Functions
    function updateProgress() {
        const answeredQuestionsCount = Object.keys(userAnswers).filter(key => userAnswers[key] !== undefined && userAnswers[key] !== null).length;
        const totalQuestions = questions.length;
        const progress = (answeredQuestionsCount / totalQuestions) * 100;
        sidebarProgressBarFill.style.width = `${progress}%`;
        sidebarQuestionCounter.textContent = `Questions Answered: ${answeredQuestionsCount} of ${totalQuestions}`;

        updateSidebarCompletedState(); // Update sidebar bubbles

        // Logic for "Your Match" button and message
        if (currentQuestionIndex === questions.length - 1) { // On the last question
            nextBtn.style.display = 'none'; // Hide next button
            yourMatchBtn.style.display = 'block'; // Show Your Match button
            if (answeredQuestionsCount >= MIN_QUESTIONS_FOR_MATCH) {
                yourMatchBtn.disabled = false; // Enable if minimum met
                minQuestionsMessage.style.display = 'none'; // Hide message
            } else {
                yourMatchBtn.disabled = true; // Disable if minimum not met
                minQuestionsMessage.style.display = 'block'; // Show message
            }
        } else { // Not on the last question
            nextBtn.style.display = 'block'; // Show next button
            yourMatchBtn.style.display = 'none'; // Hide Your Match button
            minQuestionsMessage.style.display = 'none'; // Hide message
            nextBtn.disabled = false; // Next button is always enabled for navigation
        }
        updateNavigationButtons(); // Always call to ensure correct button visibility/alignment
    }

    function displayQuestion(index) {
        if (index < 0 || index >= questions.length) {
            console.error("Invalid question index:", index);
            return;
        }

        const currentQ = questions[index];
        questionText.textContent = currentQ.question;
        optionsContainer.innerHTML = '';

        if (currentQ.scrollable) {
            optionsContainer.classList.add('options-scrollable');
        } else {
            optionsContainer.classList.remove('options-scrollable');
        }

        currentQ.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option.text;
            button.dataset.value = option.value;

            // Mark the selected option
            if (userAnswers[currentQ.id] === option.value) {
                button.classList.add('selected');
            }

            button.addEventListener('click', () => toggleOption(currentQ.id, option.value, button));
            optionsContainer.appendChild(button);
        });
        // Animate card entry
        questionCard.classList.remove('active', 'exit-left', 'exit-right');
        questionCard.style.display = 'flex'; // Ensure it's visible
        void questionCard.offsetWidth; // Trigger reflow for animation
        questionCard.classList.add('active');
        updateNavigationButtons();
        updateProgress(); // Call here to update progress bar and counter when a question is displayed
        updateSidebarActiveState();
    }

    function toggleOption(questionId, value, clickedButton) {
        const isSelected = clickedButton.classList.contains('selected');
        if (isSelected) {
            // Deselect: remove 'selected' class and remove answer
            clickedButton.classList.remove('selected');
            delete userAnswers[questionId];
        } else {
            // Select: deselect others, then select this one and store answer
            Array.from(optionsContainer.children).forEach(button => {
                button.classList.remove('selected');
            });
            clickedButton.classList.add('selected');
            userAnswers[questionId] = value;
        }
        updateProgress(); // Crucial: update progress and sidebar after selection change
    }

    function updateNavigationButtons() {
        // Back button visibility
        if (currentQuestionIndex > 0) {
            backBtn.style.display = 'flex';
            actionButtonsContainer.classList.add('justify-between'); // Space between Back and Next/Your Match
        } else {
            backBtn.style.display = 'none';
            actionButtonsContainer.classList.remove('justify-between'); // Next/Your Match only, aligned right (default)
        }
    }

    function goToNextQuestion() {
        // Add current question to history before moving forward, only if it's not already the last entry
        if (questionHistory.length === 0 || questionHistory[questionHistory.length - 1] !== currentQuestionIndex) {
            questionHistory.push(currentQuestionIndex);
        }

        questionCard.classList.remove('active');
        questionCard.classList.add('exit-left');
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion(currentQuestionIndex);
            } else {
                // All questions navigated, now attempt to show results (will check minimum)
                showResults();
            }
        }, 400); // Allow exit animation to play
    }

    function goToPreviousQuestion() {
        questionCard.classList.remove('active');
        questionCard.classList.add('exit-right');

        setTimeout(() => {
            if (questionHistory.length > 0) {
                currentQuestionIndex = questionHistory.pop(); // Go back to the previously visited question
                displayQuestion(currentQuestionIndex);
            } else {
                currentQuestionIndex = 0; // Should only happen if history is empty
                displayQuestion(currentQuestionIndex);
            }
        }, 400); // Allow exit animation to play
    }



        // This function now *prepares* the answers for the AI, rather than analyzing them itself.
    // It translates question IDs and selected values into human-readable strings.
    function prepareAnswersForAI(answers) {
        const formattedAnswers = {};
        for (const qId in answers) {
            const question = questions.find(q => q.id === qId);
            if (question) {
                const selectedOption = question.options.find(opt => opt.value === answers[qId]);
                if (selectedOption) {
                    // Use the question text and the selected option's text
                    formattedAnswers[question.question] = selectedOption.text;
                }
            }
        }
        return formattedAnswers;
    }


    async function showResults() {
        const answeredQuestionsCount = Object.keys(userAnswers).filter(key => userAnswers[key] !== undefined && userAnswers[key] !== null).length;
        if (answeredQuestionsCount < MIN_QUESTIONS_FOR_MATCH) {
            showMessageModal(`Please answer at least ${MIN_QUESTIONS_FOR_MATCH} questions to see your match.`);
            return;
        }
        
         //an element with this ID to display results
        personaSummary.innerHTML = '<p>Analyzing your responses and generating your investor persona...</p>';

        try {
            const formattedUserAnswers = prepareAnswersForAI(userAnswers);
            const endpoint = '/api/classify'
            const url = `${API_BASE_URL}${endpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionnaire_results: formattedUserAnswers,
                    classification_goal: "Generate an investor persona name and a brief description (2-3 sentences) for a startup founder based on their questionnaire responses. Also, list 3-5 key preferences or characteristics of this founder. The output should be in a JSON format with 'name', 'description', and 'details' (an array of strings) keys. For example: {'name': 'Ambitious Seed Seeker', 'description': 'This founder is leading an early-stage fintech startup aiming for rapid growth and is comfortable with some investor guidance.', 'details': ['Seeking Seed funding', 'Fintech industry focus', 'Comfortable with medium investor involvement']}"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

        if (data.success) {
            let classificationText = data.classification;

            // --- FIX START ---
            // Remove the Markdown code block wrappers if they exist
            if (classificationText.startsWith('```json')) {
                classificationText = classificationText.substring(7); // Remove '```json'
            }
            if (classificationText.endsWith('```')) {
                classificationText = classificationText.slice(0, -3); // Remove '```'
            }
            // Trim any leading/trailing whitespace that might remain
            classificationText = classificationText.trim();
            //FIX END

            let persona;
            try {
                // Attempt to parse the AI's response as JSON
                persona = JSON.parse(classificationText);
            } catch (parseError) {
                console.error("Failed to parse AI response as JSON:", parseError);
                // Fallback if AI doesn't return perfect JSON even after stripping
                persona = {
                    name: "Unclassified Persona (Parsing Error)",
                    description: "The AI returned an unparsable response. Raw output: " + classificationText,
                    details: ["Please check the console for the full error."]
                };
            }

                personaSummary.innerHTML = `
                    <p>Based on your responses, your investor persona is: <strong>${persona.name}</strong>!</p>
                    <p>${persona.description}</p>
                    ${persona.details && persona.details.length > 0 ? `<p><strong>Key Preferences:</strong></p><ul>${persona.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                `;
            } else {
                personaSummary.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            personaSummary.innerHTML = `<p>Failed to get investor persona. Please try again later. Error: ${error.message}</p>`;
        }
                reconatorContainer.querySelector('.main-quiz-content').style.display = 'none';
        reconatorContainer.querySelector('.quiz-sidebar').style.display = 'none';
        reconatorContainer.style.justifyContent = 'center'; // Center the results card
        resultsOverlay.style.display = 'flex';
        resultsOverlay.classList.add('active');
    }


    function populateSidebar() {
        sidebarQuestionList.innerHTML = ''; // Clear existing items
        questions.forEach((q, index) => {
            const listItem = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = index + 1; // Question number
            button.dataset.questionIndex = index; // Store index for navigation
            button.addEventListener('click', () => {
                // Add current question to history before moving forward, only if it's not already the last entry
                if (questionHistory.length === 0 || questionHistory[questionHistory.length - 1] !== currentQuestionIndex) {
                    questionHistory.push(currentQuestionIndex);
                }
                currentQuestionIndex = index;
                displayQuestion(currentQuestionIndex);
            });
            listItem.appendChild(button);
            sidebarQuestionList.appendChild(listItem);
        });
        updateSidebarActiveState(); // Set initial active state
        updateSidebarCompletedState(); // Set initial completed state
    }

    function updateSidebarActiveState() {
        Array.from(sidebarQuestionList.children).forEach((listItem, index) => {
            const button = listItem.querySelector('button');
            if (index === currentQuestionIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function updateSidebarCompletedState() {
        Array.from(sidebarQuestionList.children).forEach((listItem, index) => {
            const button = listItem.querySelector('button');
            const questionId = questions[index].id;
            if (userAnswers[questionId]) {
                button.classList.add('completed');
            } else {
                button.classList.remove('completed');
            }
        });
    }


    // --- Event Listeners ---
    nextBtn.addEventListener('click', goToNextQuestion);
    backBtn.addEventListener('click', goToPreviousQuestion);
    yourMatchBtn.addEventListener('click', showResults);
    backToFundMatchBtn.addEventListener('click', () => {
        resultsOverlay.classList.remove('active');
        resultsOverlay.style.display = 'none';
        reconatorContainer.querySelector('.main-quiz-content').style.display = 'flex';
        reconatorContainer.querySelector('.quiz-sidebar').style.display = 'flex';
        reconatorContainer.style.justifyContent = 'space-between';
        showMessageModal("You'd typically be redirected to your FundMatch Dashboard here!");
    });
    // --- Initial Load ---
    populateSidebar(); // Initialize sidebar first
    displayQuestion(currentQuestionIndex); // Display the first question
});