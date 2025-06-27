        const API_BASE_URL  = process.env.API_BASE_URL;
        // API helper functions
        async function apiCall(endpoint, options = {}) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        }

        async function findMatches(founderProfile) {
            return await apiCall('/match', {
                method: 'POST',
                body: JSON.stringify({
                    industry: founderProfile.industry,
                    funding_stage: founderProfile.fundingStage,
                    risk_tolerance: founderProfile.riskTolerance,
                    investment_amount: parseInt(founderProfile.investmentAmount),
                    company_name: founderProfile.companyName
                })
            });
        }

        // Form submission handler
        document.getElementById('profile-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            document.getElementById('profile-step').style.display = 'none';
            document.getElementById('loading-state').style.display = 'block';

            // Collect form data
            const founderProfile = {
                industry: document.getElementById('industry').value,
                fundingStage: document.getElementById('funding-stage').value,
                riskTolerance: document.getElementById('risk-tolerance').value,
                investmentAmount: document.getElementById('investment-amount').value,
                companyName: document.getElementById('company-name').value
            };

            try {
                // Call the backend API
                const response = await findMatches(founderProfile);
                
                if (response.success) {
                    // Display results
                    displayMatches(response.matches, founderProfile);
                } else {
                    // Handle API error
                    displayError(response.error || 'Failed to find matches');
                }
                
            } catch (error) {
                console.error('Error finding matches:', error);
                displayError('Unable to connect to the matching service. Please try again later.');
            }
            
            // Hide loading, show results
            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('results-section').style.display = 'block';
        });

        function displayMatches(matches, founderProfile) {
            const container = document.getElementById('matches-container');
            
            if (!matches || matches.length === 0) {
                container.innerHTML = `
                    <div class="match-card">
                        <h3>No matches found</h3>
                        <p>We couldn't find any investors that match your criteria. Try adjusting your requirements or check back later as we add more investors to our platform.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = matches.map((match, index) => `
                <div class="match-card">
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
                            Investment Range: ${match.investor.investment_range[0].toLocaleString()} - ${match.investor.investment_range[1].toLocaleString()}
                            | Risk Tolerance: ${match.investor.risk_tolerance.charAt(0).toUpperCase() + match.investor.risk_tolerance.slice(1)}
                            ${match.investor.location ? ` | ${match.investor.location}` : ''}
                        </small>
                    </div>
                    
                    ${match.investor.contact ? `
                        <div style="margin-top: 0.5rem;">
                            <small style="color: var(--primary-blue);">
                                📧 ${match.investor.contact}
                            </small>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        function displayError(errorMessage) {
            const container = document.getElementById('matches-container');
            container.innerHTML = `
                <div class="match-card" style="border-left-color: #E74C3C;">
                    <h3 style="color: #E74C3C;">Error</h3>
                    <p>${errorMessage}</p>
                    <button class="btn btn-primary" onclick="resetForm()" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }

        function resetForm() {
            document.getElementById('profile-form').reset();
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('profile-step').style.display = 'block';
        }

        // Add form validation feedback
        document.querySelectorAll('.form-input, .form-select').forEach(element => {
            element.addEventListener('invalid', function() {
                this.style.borderColor = '#E74C3C';
            });
            
            element.addEventListener('input', function() {
                if (this.checkValidity()) {
                    this.style.borderColor = '#27AE60';
                } else {
                    this.style.borderColor = 'var(--border-light)';
                }
            });
        });