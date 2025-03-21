document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputLeft = document.getElementById('input-left');
    const inputRight = document.getElementById('input-right');
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const resultsContainer = document.getElementById('results-container');
    const comparisonContent = document.getElementById('comparison-content');
    const leftHeader = document.getElementById('left-header');
    const rightHeader = document.getElementById('right-header');
    
    // Event Listeners
    inputLeft.addEventListener('input', validateInputs);
    inputRight.addEventListener('input', validateInputs);
    compareBtn.addEventListener('click', handleCompare);
    clearBtn.addEventListener('click', clearAll);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Check for saved theme preference
    initTheme();
    
    // Functions
    function validateInputs() {
        const hasLeftValue = inputLeft.value.trim() !== '';
        const hasRightValue = inputRight.value.trim() !== '';
        compareBtn.disabled = !(hasLeftValue && hasRightValue);
    }
    
    function clearAll() {
        inputLeft.value = '';
        inputRight.value = '';
        compareBtn.disabled = true;
        compareBtn.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        document.querySelector('.comparison-inputs').classList.remove('hidden-mobile');
        document.querySelector('.vs-container').classList.remove('rotating');
    }
    
    async function handleCompare() {
        const item1 = inputLeft.value.trim();
        const item2 = inputRight.value.trim();
        
        if (!item1 || !item2) return;
        
        // Update headers
        leftHeader.textContent = item1;
        rightHeader.textContent = item2;
        
        // Hide compare button and input section on mobile, show progress bar and start VS rotation
        compareBtn.classList.add('hidden');
        if (window.innerWidth <= 768) {
            document.querySelector('.comparison-inputs').classList.add('hidden-mobile');
        }
        document.querySelector('.vs-container').classList.add('rotating');
        const progressBar = document.getElementById('progress-bar');
        const progressFill = progressBar.querySelector('.progress-fill');
        progressBar.classList.remove('hidden');
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 1;
                progressFill.style.width = `${progress}%`;
            }
        }, 50);
        
        // Hide results until we have new data
        resultsContainer.classList.add('hidden');
        
        try {
            // Call the OpenAI API to get real comparison data
            const comparisonData = await getComparisonData(item1, item2);
            displayResults(comparisonData);
            // Complete progress bar animation and show results
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            setTimeout(() => {
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                resultsContainer.classList.remove('hidden');
                document.querySelector('.vs-container').classList.remove('rotating');
            }, 300);
        } catch (error) {
            console.error('Error comparing items:', error);
            // Show error message and reset progress bar
            clearInterval(progressInterval);
            progressBar.classList.add('hidden');
            progressFill.style.width = '0%';
            comparisonContent.innerHTML = `<p class="error-message">Sorry, we couldn't generate a comparison at this time. Please try again later.</p>`;
            resultsContainer.classList.remove('hidden');
            document.querySelector('.vs-container').classList.remove('rotating');
        }
    }
    
    function displayResults(data) {
        comparisonContent.innerHTML = '';
        // Remove existing clear button if any
        const existingClearBtn = comparisonContent.querySelector('.clear-results-btn');
        if (existingClearBtn) {
            existingClearBtn.remove();
        }
        
        // Split the response by comparison factors
        const lines = data.split('\n');
        let currentSection = null;
        let currentFactor = '';
        let conclusionSection = null;
        let conclusionText = [];
        
        // Process each line of the response
        lines.forEach(line => {
            line = line.trim();
            
            // Skip empty lines
            if (!line) return;
            
            // Check if this is a comparison factor line
            if (line.includes(':-') || /^\d+\.\s+[\w\s]+:-/.test(line)) {
                // If we have a previous section (that's not the conclusion), add it to the content
                if (currentSection && !currentSection.classList.contains('conclusion')) {
                    comparisonContent.appendChild(currentSection);
                }
                
                // Create a new section for this comparison factor
                currentSection = document.createElement('div');
                currentSection.className = 'comparison-section';
                
                // Extract the factor name and remove any asterisk symbols and brackets
                currentFactor = line.replace(/^\d+\.\s+/, '').replace(':-', '').replace(/\*/g, '').replace(/[\[\]\(\)\{\}]/g, '');
                
                // Create a header for this factor
                const factorHeader = document.createElement('h3');
                factorHeader.className = 'comparison-factor';
                factorHeader.textContent = currentFactor;
                currentSection.appendChild(factorHeader);
                
                // Create a container for the items
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'comparison-items';
                currentSection.appendChild(itemsContainer);
            } 
            // Check if this is an item line (starts with a colon)
            else if (line.startsWith(':')) {
                if (!currentSection) return;
                
                // Get the items container
                const itemsContainer = currentSection.querySelector('.comparison-items');
                
                // Create an item element
                const item = document.createElement('div');
                item.className = 'comparison-item';
                
                // Parse the item line
                const itemMatch = line.match(/:\s+([^:]+)\s+:\s+(.+)\s+⭐️\s+(\d+)/);
                
                if (itemMatch) {
                    const [, itemName, description, rating] = itemMatch;
                    
                    // Create item header with name
                    const itemHeader = document.createElement('div');
                    itemHeader.className = 'item-header';
                    itemHeader.textContent = itemName.trim();
                    item.appendChild(itemHeader);
                    
                    // Create item description
                    const itemDesc = document.createElement('div');
                    itemDesc.className = 'item-description';
                    itemDesc.textContent = description.trim();
                    item.appendChild(itemDesc);
                    
                    // Create rating element
                    const itemRating = document.createElement('div');
                    itemRating.className = 'item-rating';
                    
                    // Get the numeric rating value
                    const ratingValue = parseInt(rating.trim());
                    
                    // Add color class based on rating value
                    if (ratingValue <= 3) {
                        itemRating.classList.add('rating-low');
                    } else if (ratingValue <= 7) {
                        itemRating.classList.add('rating-medium');
                    } else {
                        itemRating.classList.add('rating-high');
                    }
                    
                    itemRating.innerHTML = `⭐️ ${rating.trim()}/10`;
                    item.appendChild(itemRating);
                    
                    // Add the item to the container
                    itemsContainer.appendChild(item);
                } else {
                    // If we can't parse it properly, just add the text
                    item.textContent = line.substring(1).trim();
                    itemsContainer.appendChild(item);
                }
            }
            // This is likely the conclusion or winner section
            else if (line.toLowerCase().includes('winner') || line.toLowerCase().includes('conclusion')) {
                // If we have a previous non-conclusion section, add it to the content
                if (currentSection && !currentSection.classList.contains('conclusion')) {
                    comparisonContent.appendChild(currentSection);
                }
                
                // Store conclusion text for later
                conclusionText.push(line.replace(/\*/g, ''));
                
                // Create conclusion section if it doesn't exist
                if (!conclusionSection) {
                    conclusionSection = document.createElement('div');
                    conclusionSection.className = 'comparison-section conclusion';
                    
                    const conclusionHeader = document.createElement('h3');
                    conclusionHeader.className = 'conclusion-header';
                    conclusionHeader.textContent = 'Conclusion';
                    conclusionSection.appendChild(conclusionHeader);
                }
                currentSection = conclusionSection;
            }
            // Add any other lines to the current section
            else if (currentSection) {
                if (currentSection === conclusionSection) {
                    // Store conclusion text for later
                    conclusionText.push(line.replace(/\*/g, ''));
                } else {
                    // Add as a note to the current section
                    const note = document.createElement('div');
                    note.className = 'comparison-note';
                    note.textContent = line;
                    currentSection.appendChild(note);
                }
            }
        });
        
        // Add the last non-conclusion section if it exists
        if (currentSection && !currentSection.classList.contains('conclusion')) {
            comparisonContent.appendChild(currentSection);
        }
        
        // Add the conclusion section at the end if it exists
        if (conclusionSection) {
            const conclusionTextElement = document.createElement('div');
            conclusionTextElement.className = 'conclusion-text';
            conclusionTextElement.textContent = conclusionText.join('\n');
            conclusionSection.appendChild(conclusionTextElement);
            comparisonContent.appendChild(conclusionSection);
        }

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'results-buttons';

        // Add clear results button
        const clearResultsBtn = document.createElement('button');
        clearResultsBtn.className = 'clear-results-btn';
        clearResultsBtn.textContent = 'Clear';
        clearResultsBtn.addEventListener('click', clearAll);
        buttonContainer.appendChild(clearResultsBtn);

        // Add share button
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
        shareBtn.addEventListener('click', () => shareResults(data));
        buttonContainer.appendChild(shareBtn);

        comparisonContent.appendChild(buttonContainer);

        // Function to format and share results
        function shareResults(data) {
            const item1 = leftHeader.textContent;
            const item2 = rightHeader.textContent;
            
            let shareText = "🤖 Generated using ComparatorAI - Your AI-Powered Comparison Tool\n";
            shareText += "🔗 Try it out at [ComparatorAI](https://app-dev-happy.github.io/ComparatorAi/)\n\n";
            shareText += `📊 Comparison: ${item1} vs ${item2}\n\n`;

            const lines = data.split('\n');
            let currentFactor = '';
            let factorCount = 0;

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                if (line.includes(':-') || /^\d+\.\s+[\w\s]+:-/.test(line)) {
                    factorCount++;
                    currentFactor = line.replace(/^\d+\.\s+/, '').replace(':-', '').replace(/\*/g, '').replace(/[\[\]\(\)\{\}]/g, '');
                    shareText += `\n${factorCount}. ${currentFactor}\n`;
                } 
                else if (line.startsWith(':')) {
                    const itemMatch = line.match(/:\s+([^:]+)\s+:\s+(.+)\s+⭐️\s+(\d+)/);
                    if (itemMatch) {
                        const [, itemName, description, rating] = itemMatch;
                        shareText += `   • ${itemName.trim()}\n     ${description.trim()}\n     Rating: ${rating.trim()}/10\n`;
                    }
                }
                else if (line.toLowerCase().includes('winner') || line.toLowerCase().includes('conclusion')) {
                    shareText += `\n🏆 Final Verdict\n${line}\n`;
                }
            });

            shareText += "\n-----------------------------------";
            shareText += "\n🤖 Generated using ComparatorAI - Your AI-Powered Comparison Tool";
            shareText += "\n🔗 Try it out: https://app-dev-happy.github.io/ComparatorAi/";

            // Copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                const notification = document.createElement('div');
                notification.className = 'copy-notification';
                notification.textContent = '✓ Comparison copied to clipboard!';
                document.body.appendChild(notification);
                
                // Remove notification after 2 seconds
                setTimeout(() => {
                    notification.remove();
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy to clipboard. Please try again.');
            });
        }
    }
    
    // This function makes a real API call to Google Gemini AI
    async function getComparisonData(item1, item2) {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBgEmN5NlnxZijfl6N4yBCYPwZib-pCPFI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': 'AIzaSyBgEmN5NlnxZijfl6N4yBCYPwZib-pCPFI' // Replace with your actual Gemini API key
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Compare ${item1} with ${item2}. Provide a numbered list of the factors of comparison you feel are appropriate.
                                            Every comparison factor should be on a new line.
                                            The answer you will provide should be factual and not opinionated.
                                            The answer should be in the following format:
                                            {comparison factor 1} :-
                                                : {item 1} : {description} ⭐️ {rating},
                                                : {item 2} : {description} ⭐️ {rating}

                                            {comparison factor 2} :-
                                                : {item 1} : {description} ⭐️ {rating},
                                                : {item 2} : {description} ⭐️ {rating}

                                            {comparison factor 3} :-
                                                : {item 1} : {description} ⭐️ {rating},
                                                : {item 2} : {description} ⭐️ {rating}

                                            ...
                                            In the end there should be a clear winner based on the average of the ratings (1-10 range).
                                            Be factual and concise. Explain enough to make a decision.
                                            Use emojis where appropriate.
                                            Every comparison factor should be on a new line.
                                            `
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            // Gemini returns response in a different format than OpenAI
            // Add robust error handling to check if the expected properties exist
            if (!data || !data.candidates || !data.candidates[0] || 
                !data.candidates[0].content || !data.candidates[0].content.parts || 
                !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
                console.error('Unexpected API response structure:', data);
                throw new Error('Invalid API response structure');
            }
            
            // Return the raw text content from the API
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }
    

    
    // Theme functions
    function initTheme() {
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    function toggleTheme() {
        if (document.body.classList.contains('dark-mode')) {
            // Switch to light mode
            document.body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to dark mode
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // No helper function needed as we're displaying the raw text response
});

// Note: In a production environment, this would integrate with an actual API key
// for Google's Gemini AI to generate real comparisons
// Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API key to use the application