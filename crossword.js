/**
 * Dense Crossword Layout Matrix & Navigation Engine
 */
const CrosswordEngine = {
    gridSize: 13,

    renderGrid: function(container, puzzleData) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        const gridMatrix = Array.from({ length: this.gridSize }, () =>
            Array.from({ length: this.gridSize }, () => ({
                isPlayable: false,
                displayNum: null,
                targetChar: '',
                intersections: { A: null, D: null }
            }))
        );

        const layoutPlan = this.calculateDenseLayout(puzzleData);

        layoutPlan.forEach((item) => {
            let currentR = item.row;
            let currentC = item.col;

            if (this.isInBounds(currentR, currentC)) {
                if (!gridMatrix[currentR][currentC].displayNum) {
                    gridMatrix[currentR][currentC].displayNum = item.num;
                }
            }

            for (let i = 0; i < item.word.length; i++) {
                if (this.isInBounds(currentR, currentC)) {
                    let cell = gridMatrix[currentR][currentC];
                    cell.isPlayable = true;
                    cell.targetChar = item.word[i].toUpperCase();
                    
                    if (item.dir === 'A') {
                        cell.intersections.A = item.num;
                        currentC++;
                    } else {
                        cell.intersections.D = item.num;
                        currentR++;
                    }
                }
            }
        });

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cellState = gridMatrix[r][c];
                const cellContainer = document.createElement('div');
                cellContainer.classList.add('crossword-cell');

                if (!cellState.isPlayable) {
                    cellContainer.classList.add('black-block');
                } else {
                    if (cellState.displayNum) {
                        const label = document.createElement('span');
                        label.classList.add('cell-number-label');
                        label.textContent = cellState.displayNum;
                        cellContainer.appendChild(label);
                    }

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.classList.add('cell-character-input');
                    input.setAttribute('autocomplete', 'off');
                    input.setAttribute('spellcheck', 'false');
                    
                    input.dataset.row = r;
                    input.dataset.col = c;
                    if (cellState.intersections.A) input.dataset.acrossClue = cellState.intersections.A;
                    if (cellState.intersections.D) input.dataset.downClue = cellState.intersections.D;
                    input.dataset.activeDir = 'A'; 

                    cellContainer.appendChild(input);
                }
                container.appendChild(cellContainer);
            }
        }
        this.bindInputKeyboardRouter(container);
    },

    isInBounds: function(r, c) {
        return r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize;
    },

    calculateDenseLayout: function(puzzleData) {
        const structuralMap = [
            { row: 0, col: 0 }, { row: 2, col: 0 }, { row: 4, col: 0 }, { row: 6, col: 4 }, { row: 8, col: 2 }, 
            { row: 0, col: 0 }, { row: 0, col: 4 }, { row: 0, col: 2 }, { row: 3, col: 6 }, { row: 1, col: 8 }  
        ];

        return puzzleData.map((data, index) => {
            const placement = structuralMap[index] || { row: index, col: 1 };
            let num = index + 1;
            if (index >= 5) num = index - 4;
            return { word: data.word, dir: data.dir, row: placement.row, col: placement.col, num: num };
        });
    },

    bindInputKeyboardRouter: function(container) {
        container.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('cell-character-input')) return;

            const currentInput = e.target;
            const r = parseInt(currentInput.dataset.row);
            const c = parseInt(currentInput.dataset.col);
            let activeDirection = currentInput.dataset.activeDir;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    const newDirection = (activeDirection === 'A') ? 'D' : 'A';
                    container.querySelectorAll('.cell-character-input').forEach(input => {
                        input.dataset.activeDir = newDirection;
                    });
                    this.updateClueHighlight(currentInput);
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    this.shiftFocus(container, r, c + 1, 'A');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.shiftFocus(container, r, c - 1, 'A');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.shiftFocus(container, r + 1, c, 'D');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.shiftFocus(container, r - 1, c, 'D');
                    break;

                case 'Backspace':
                    e.preventDefault();
                    if (currentInput.value !== '') {
                        currentInput.value = '';
                    } else {
                        let target = (activeDirection === 'A') ? 
                            this.shiftFocus(container, r, c - 1, 'A') : 
                            this.shiftFocus(container, r - 1, c, 'D');
                        if (target) target.value = '';
                    }
                    break;

                default:
                    if (e.key.match(/^[a-zA-Z]$/)) {
                        e.preventDefault();
                        currentInput.value = e.key.toUpperCase();
                        if (activeDirection === 'A') {
                            this.shiftFocus(container, r, c + 1, 'A');
                        } else {
                            this.shiftFocus(container, r + 1, c, 'D');
                        }
                    }
                    break;
            }
        });

        container.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('cell-character-input')) {
                this.updateClueHighlight(e.target);
            }
        });
    },

    shiftFocus: function(container, targetRow, targetCol, preferredDir) {
        const targetInput = container.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
        if (targetInput) {
            targetInput.focus();
            if (preferredDir) {
                container.querySelectorAll('.cell-character-input').forEach(i => i.dataset.activeDir = preferredDir);
            }
            this.updateClueHighlight(targetInput);
            return targetInput;
        }
        return null;
    },

    updateClueHighlight: function(inputElement) {
        document.querySelectorAll('.clue-list li').forEach(li => li.style.backgroundColor = 'transparent');
        
        const activeDir = inputElement.dataset.activeDir;
        const clueNumber = (activeDir === 'A') ? inputElement.dataset.acrossClue : inputElement.dataset.downClue;
        
        if (clueNumber) {
            const listId = (activeDir === 'A') ? 'across-clues' : 'down-clues';
            const clueItems = document.getElementById(listId).getElementsByTagName('li');
            
            for (let item of clueItems) {
                if (item.querySelector('strong').textContent.startsWith(`${clueNumber}${activeDir}`)) {
                    item.style.backgroundColor = 'var(--clue-highlight)';
                    break;
                }
            }
        }
    }
};
