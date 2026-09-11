/**
 * Main Controller & View State Orchestrator
 */
document.addEventListener('DOMContentLoaded', () => {
    const dishInput = document.getElementById('dish-input');
    const generateBtn = document.getElementById('generate-btn');
    const errorToast = document.getElementById('error-toast');
    const activeDishTitle = document.getElementById('active-dish-title');
    const acrossCluesList = document.getElementById('across-clues');
    const downCluesList = document.getElementById('down-clues');
    const crosswordGrid = document.getElementById('crossword-grid');
    const eraseBtn = document.getElementById('erase-btn');

    async function orchestratePuzzlePipeline() {
        const queryText = dishInput.value.trim();
        
        errorToast.classList.add('hidden');
        errorToast.textContent = '';

        if (!AI_ENGINE.validateDish(queryText)) {
            errorToast.textContent = `CRITICAL ERROR: Input must contain valid alphabetical characters.`;
            errorToast.classList.remove('hidden');
            return;
        }

        crosswordGrid.innerHTML = `<div class="grid-placeholder">Consulting culinary matrix nodes... Please stand by.</div>`;
        generateBtn.disabled = true;
        generateBtn.textContent = "Processing...";

        try {
            const puzzleData = await AI_ENGINE.generateCrosswordPayload(queryText);

            activeDishTitle.textContent = `How to Make ${capitalizePhrase(queryText)}`;
            acrossCluesList.innerHTML = '';
            downCluesList.innerHTML = '';

            puzzleData.forEach((item, index) => {
                let labelNum = index + 1;
                if (index >= 5) labelNum = index - 4;

                const li = document.createElement('li');
                li.innerHTML = `<strong>${labelNum}${item.dir}</strong> ${item.clue}`;
                
                if (item.dir === 'A') {
                    acrossCluesList.appendChild(li);
                } else {
                    downCluesList.appendChild(li);
                }
            });

            CrosswordEngine.renderGrid(crosswordGrid, puzzleData);

        } catch (error) {
            errorToast.textContent = `⚠️ Engine Fault: ${error.message}`;
            errorToast.classList.remove('hidden');
            crosswordGrid.innerHTML = `<div class="grid-placeholder">Generation aborted.<br>${error.message}</div>`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Make Recipe"; // Matches index button layout update string
        }
    }

    function capitalizePhrase(str) {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function clearActivePuzzleMatrix() {
        const inputs = crosswordGrid.querySelectorAll('.cell-character-input');
        inputs.forEach(input => input.value = '');
        if (inputs.length > 0) inputs.focus();
    }

    generateBtn.addEventListener('click', orchestratePuzzlePipeline);
    dishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') orchestratePuzzlePipeline();
    });
    eraseBtn.addEventListener('click', clearActivePuzzleMatrix);
});
