var board;
var score = 0;
var rows = 4;
var cols = 4;
var highScore = 0;
var autoPlayInterval = null;
var savedTheme = 'wooden';

// Load and apply saved theme
window.onload = function () {
    // Using in-memory storage instead of localStorage
    document.body.className = savedTheme;
    document.getElementById("high-score").innerText = highScore;
    setGame();
};

// Change theme and save it
function setTheme(theme) {
    document.body.className = theme;
    savedTheme = theme;
    updateThemeButtons();
}

// Highlight active theme button
function updateThemeButtons() {
    document.querySelectorAll(".theme-btn").forEach(btn => {
        if (btn.textContent.toLowerCase() === document.body.className) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function setGame() {
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    document.getElementById("board").innerHTML = "";
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let tile = document.createElement("div");
            tile.id = r + "-" + c;
            updateTile(tile, board[r][c]);
            document.getElementById("board").append(tile);
        }
    }
    score = 0;
    updateScore();
    setTwo();
    setTwo();
}

function hasEmptyTile() {
    return board.some(row => row.includes(0));
}

function setTwo() {
    if (!hasEmptyTile()) return;
    let found = false;
    while (!found) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (board[r][c] == 0) {
            board[r][c] = Math.random() < 0.9 ? 2 : 4;
            let tile = document.getElementById(r + "-" + c);
            updateTile(tile, board[r][c], true);
            found = true;
        }
    }
}

function updateTile(tile, num, isNew = false, isMerged = false) {
    tile.innerText = "";
    tile.className = "tile";
    if (num > 0) {
        tile.innerText = num;
        tile.classList.add("x" + num);
        if (isNew) {
            tile.classList.add("spawn");
            setTimeout(() => tile.classList.remove("spawn"), 200);
        }
        if (isMerged) {
            tile.classList.add("merge");
            setTimeout(() => tile.classList.remove("merge"), 200);
        }
    }
}

document.addEventListener("keyup", (e) => {
    let moved = false;
    if (e.code == "ArrowLeft") moved = slideLeft();
    else if (e.code == "ArrowRight") moved = slideRight();
    else if (e.code == "ArrowUp") moved = slideUp();
    else if (e.code == "ArrowDown") moved = slideDown();

    if (moved) {
        setTwo();
        updateScore();
        checkWin();
        if (isGameOver()) {
            stopAutoPlay();
            alert("Game Over! Final Score: " + score);
        }
    }
});

function filterZero(row) {
    return row.filter(num => num != 0);
}

function slide(row, rIndex, cIndexStart, isCol = false) {
    row = filterZero(row);
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] == row[i + 1]) {
            row[i] *= 2;
            row[i + 1] = 0;
            score += row[i];
        }
    }
    row = filterZero(row);
    while (row.length < cols) row.push(0);
    return row;
}

function slideLeft() {
    let moved = false;
    for (let r = 0; r < rows; r++) {
        let oldRow = [...board[r]];
        board[r] = slide(board[r], r, 0);
        if (JSON.stringify(oldRow) !== JSON.stringify(board[r])) moved = true;
        updateRow(r);
    }
    return moved;
}

function slideRight() {
    let moved = false;
    for (let r = 0; r < rows; r++) {
        let oldRow = [...board[r]];
        board[r].reverse();
        board[r] = slide(board[r], r, 0);
        board[r].reverse();
        if (JSON.stringify(oldRow) !== JSON.stringify(board[r])) moved = true;
        updateRow(r);
    }
    return moved;
}

function slideUp() {
    let moved = false;
    for (let c = 0; c < cols; c++) {
        let colArr = [board[0][c], board[1][c], board[2][c], board[3][c]];
        let oldCol = [...colArr];
        colArr = slide(colArr, c, 0, true);
        for (let r = 0; r < rows; r++) board[r][c] = colArr[r];
        if (JSON.stringify(oldCol) !== JSON.stringify(colArr)) moved = true;
        updateCol(c);
    }
    return moved;
}

function slideDown() {
    let moved = false;
    for (let c = 0; c < cols; c++) {
        let colArr = [board[0][c], board[1][c], board[2][c], board[3][c]];
        let oldCol = [...colArr];
        colArr.reverse();
        colArr = slide(colArr, c, 0, true);
        colArr.reverse();
        for (let r = 0; r < rows; r++) board[r][c] = colArr[r];
        if (JSON.stringify(oldCol) !== JSON.stringify(colArr)) moved = true;
        updateCol(c);
    }
    return moved;
}

function updateRow(r) {
    for (let c = 0; c < cols; c++) updateTile(document.getElementById(r + "-" + c), board[r][c]);
}

function updateCol(c) {
    for (let r = 0; r < rows; r++) updateTile(document.getElementById(r + "-" + c), board[r][c]);
}

function updateScore() {
    document.getElementById("score").innerText = score;
    if (score > highScore) {
        highScore = score;
        document.getElementById("high-score").innerText = highScore;
    }
}

function checkWin() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 2048) {
                stopAutoPlay();
                alert("🎉 You win! Keep going or restart!");
                return;
            }
        }
    }
}

function isGameOver() {
    if (hasEmptyTile()) return false;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (c < cols - 1 && board[r][c] === board[r][c + 1]) return false;
            if (r < rows - 1 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    return true;
}

// ========== AI FUNCTIONS ==========
function cloneBoard(b) {
    return b.map(row => [...row]);
}

function simulateMove(b, direction) {
    let testBoard = cloneBoard(b);
    let testScore = 0;
    let moved = false;

    switch(direction) {
        case 'left':
            for (let r = 0; r < rows; r++) {
                let oldRow = [...testBoard[r]];
                let row = testBoard[r].filter(n => n !== 0);
                for (let i = 0; i < row.length - 1; i++) {
                    if (row[i] === row[i + 1]) {
                        row[i] *= 2;
                        row[i + 1] = 0;
                        testScore += row[i];
                    }
                }
                row = row.filter(n => n !== 0);
                while (row.length < cols) row.push(0);
                testBoard[r] = row;
                if (JSON.stringify(oldRow) !== JSON.stringify(testBoard[r])) moved = true;
            }
            break;
        case 'right':
            for (let r = 0; r < rows; r++) {
                let oldRow = [...testBoard[r]];
                let row = testBoard[r].filter(n => n !== 0).reverse();
                for (let i = 0; i < row.length - 1; i++) {
                    if (row[i] === row[i + 1]) {
                        row[i] *= 2;
                        row[i + 1] = 0;
                        testScore += row[i];
                    }
                }
                row = row.filter(n => n !== 0);
                while (row.length < cols) row.push(0);
                testBoard[r] = row.reverse();
                if (JSON.stringify(oldRow) !== JSON.stringify(testBoard[r])) moved = true;
            }
            break;
        case 'up':
            for (let c = 0; c < cols; c++) {
                let col = [];
                for (let r = 0; r < rows; r++) col.push(testBoard[r][c]);
                let oldCol = [...col];
                col = col.filter(n => n !== 0);
                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i + 1]) {
                        col[i] *= 2;
                        col[i + 1] = 0;
                        testScore += col[i];
                    }
                }
                col = col.filter(n => n !== 0);
                while (col.length < rows) col.push(0);
                for (let r = 0; r < rows; r++) testBoard[r][c] = col[r];
                if (JSON.stringify(oldCol) !== JSON.stringify(col)) moved = true;
            }
            break;
        case 'down':
            for (let c = 0; c < cols; c++) {
                let col = [];
                for (let r = 0; r < rows; r++) col.push(testBoard[r][c]);
                let oldCol = [...col];
                col = col.filter(n => n !== 0).reverse();
                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i + 1]) {
                        col[i] *= 2;
                        col[i + 1] = 0;
                        testScore += col[i];
                    }
                }
                col = col.filter(n => n !== 0);
                while (col.length < rows) col.push(0);
                col = col.reverse();
                for (let r = 0; r < rows; r++) testBoard[r][c] = col[r];
                if (JSON.stringify(oldCol) !== JSON.stringify(col)) moved = true;
            }
            break;
    }

    return { board: testBoard, score: testScore, moved: moved };
}

function evaluateBoard(b) {
    let score = 0;
    let emptyTiles = 0;
    let maxTile = 0;
    
    // Count empty tiles and find max tile
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (b[r][c] === 0) emptyTiles++;
            if (b[r][c] > maxTile) maxTile = b[r][c];
        }
    }
    
    // Empty tiles bonus (very important)
    score += emptyTiles * 10000;
    
    // Monotonicity (tiles should increase/decrease in one direction)
    let mono = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
            if (b[r][c] !== 0 && b[r][c + 1] !== 0) {
                if (b[r][c] >= b[r][c + 1]) mono += Math.log2(b[r][c]);
                else mono -= Math.log2(b[r][c + 1]);
            }
        }
    }
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
            if (b[r][c] !== 0 && b[r + 1][c] !== 0) {
                if (b[r][c] >= b[r + 1][c]) mono += Math.log2(b[r][c]);
                else mono -= Math.log2(b[r + 1][c]);
            }
        }
    }
    score += Math.abs(mono) * 1000;
    
    // Smoothness (adjacent tiles should be similar)
    let smoothness = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (b[r][c] !== 0) {
                if (c < cols - 1 && b[r][c + 1] !== 0) {
                    smoothness -= Math.abs(Math.log2(b[r][c]) - Math.log2(b[r][c + 1]));
                }
                if (r < rows - 1 && b[r + 1][c] !== 0) {
                    smoothness -= Math.abs(Math.log2(b[r][c]) - Math.log2(b[r + 1][c]));
                }
            }
        }
    }
    score += smoothness * 100;
    
    // Bonus for keeping highest tile in corner
    if (b[0][0] === maxTile || b[0][3] === maxTile || 
        b[3][0] === maxTile || b[3][3] === maxTile) {
        score += maxTile * 10;
    }
    
    // Edge bonus (prefer keeping high values on edges)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (b[r][c] !== 0) {
                if (r === 0 || r === 3 || c === 0 || c === 3) {
                    score += Math.log2(b[r][c]) * 20;
                }
            }
        }
    }
    
    return score;
}

function getBestMove() {
    const directions = ['left', 'right', 'up', 'down'];
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (let dir of directions) {
        let result = simulateMove(board, dir);
        if (!result.moved) continue;
        
        // Simulate random tile placement and evaluate outcomes
        let totalScore = 0;
        let simulations = 0;
        
        // Find empty positions after the move
        let emptyPositions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (result.board[r][c] === 0) {
                    emptyPositions.push([r, c]);
                }
            }
        }
        
        // Sample a few random positions for new tiles
        let samples = Math.min(emptyPositions.length, 4);
        for (let i = 0; i < samples; i++) {
            let testBoard = cloneBoard(result.board);
            let pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            testBoard[pos[0]][pos[1]] = Math.random() < 0.9 ? 2 : 4;
            
            // Look ahead one more move
            let futureScore = -Infinity;
            for (let futureDir of directions) {
                let futureResult = simulateMove(testBoard, futureDir);
                if (futureResult.moved) {
                    let evalScore = evaluateBoard(futureResult.board) + futureResult.score * 10;
                    if (evalScore > futureScore) {
                        futureScore = evalScore;
                    }
                }
            }
            
            totalScore += futureScore;
            simulations++;
        }
        
        let avgScore = simulations > 0 ? totalScore / simulations : evaluateBoard(result.board);
        avgScore += result.score * 100; // Immediate score bonus
        
        if (avgScore > bestScore) {
            bestScore = avgScore;
            bestMove = dir;
        }
    }
    
    return bestMove;
}

function showHint() {
    if (isGameOver()) {
        document.getElementById('hintDisplay').innerHTML = "Game Over! Press F5 to restart.";
        return;
    }
    
    let bestMove = getBestMove();
    if (bestMove) {
        let arrow = '';
        switch(bestMove) {
            case 'left': arrow = '←'; break;
            case 'right': arrow = '→'; break;
            case 'up': arrow = '↑'; break;
            case 'down': arrow = '↓'; break;
        }
        document.getElementById('hintDisplay').innerHTML = 
            `<span class="hint-arrow">${arrow}</span> Best move: ${bestMove.toUpperCase()}`;
    } else {
        document.getElementById('hintDisplay').innerHTML = "No valid moves available!";
    }
}

function toggleAutoPlay() {
    if (autoPlayInterval) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    document.getElementById('autoPlayBtn').classList.add('playing');
    document.getElementById('autoPlayBtn').innerHTML = '⏸️ Stop';
    
    autoPlayInterval = setInterval(() => {
        if (isGameOver()) {
            stopAutoPlay();
            return;
        }
        
        let bestMove = getBestMove();
        if (bestMove) {
            let moved = false;
            switch(bestMove) {
                case 'left': moved = slideLeft(); break;
                case 'right': moved = slideRight(); break;
                case 'up': moved = slideUp(); break;
                case 'down': moved = slideDown(); break;
            }
            
            if (moved) {
                setTwo();
                updateScore();
                checkWin();
            }
        }
    }, 1000); // Adjust speed as needed
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        document.getElementById('autoPlayBtn').classList.remove('playing');
        document.getElementById('autoPlayBtn').innerHTML = '▶️ Auto Play';
    }
}

// Save game state to localStorage
function saveGameState(board, score, highScore) {
    localStorage.setItem('board', JSON.stringify(board));
    localStorage.setItem('score', score);
    localStorage.setItem('highScore', highScore);
}

// Load game state from localStorage
function loadGameState() {
    const board = JSON.parse(localStorage.getItem('board'));
    const score = parseInt(localStorage.getItem('score')) || 0;
    const highScore = parseInt(localStorage.getItem('highScore')) || 0;
    return { board, score, highScore };
}

// Modify your game initialization to load previous state if available
function initGame() {
    const saved = loadGameState();
    if (saved.board && Array.isArray(saved.board)) {
        board = saved.board;
        score = saved.score;
        highScore = saved.highScore;
    } else {
        // ...existing code to initialize a new game...
    }
    updateBoard();
    updateScore();
}

// Call saveGameState after every move or score change
function move(direction) {
    // ...existing move logic...
    saveGameState(board, score, highScore);
}

// Also call saveGameState when resetting or starting a new game
function resetGame() {
    // ...existing reset logic...
    saveGameState(board, score, highScore);
}
