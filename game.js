// Game State
const gameState = {
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    isRolling: false,
    gameStarted: false
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadGameConfig();
    initializeGame();
    setupEventListeners();
});

// Load configuration from localStorage
function loadGameConfig() {
    const config = JSON.parse(localStorage.getItem('ludoConfig') || '{}');

    // Set up players
    const playerColors = config.playerColors || ['red', 'blue', 'green', 'yellow'];
    const playerNames = config.playerNames || ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    const botCount = config.botCount || 0;

    for (let i = 0; i < 4; i++) {
        gameState.players.push({
            id: i,
            name: playerNames[i] || `Player ${i + 1}`,
            color: playerColors[i],
            isBot: i >= (4 - botCount),
            pieces: [
                { id: 0, position: -1, inHome: true },
                { id: 1, position: -1, inHome: true },
                { id: 2, position: -1, inHome: true },
                { id: 3, position: -1, inHome: true }
            ]
        });
    }

    // Update player names in UI
    gameState.players.forEach((player, index) => {
        const nameElement = document.getElementById(`player-${index}-name`);
        if (nameElement) {
            nameElement.textContent = player.name;
        }
    });

    // Update current player display
    updateCurrentPlayerDisplay();
}

// Initialize game UI
function initializeGame() {
    renderPlayersList();
    gameState.gameStarted = true;
}

// Setup event listeners
function setupEventListeners() {
    // Dice roll button
    const rollBtn = document.getElementById('roll-btn');
    const dice = document.getElementById('dice');

    rollBtn.addEventListener('click', rollDice);
    dice.addEventListener('click', rollDice);
    dice.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            rollDice();
        }
    });

    // Game pieces
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(piece => {
        piece.addEventListener('click', () => handlePieceClick(piece));
        piece.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePieceClick(piece);
            }
        });
    });

    // Control buttons
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('quit-btn').addEventListener('click', quitGame);
    document.getElementById('menu-btn').addEventListener('click', toggleMenu);
}

// Roll dice with animation
function rollDice() {
    if (gameState.isRolling) return;

    const dice = document.getElementById('dice');
    const rollBtn = document.getElementById('roll-btn');
    const diceValue = document.querySelector('.dice-value');

    gameState.isRolling = true;
    dice.classList.add('rolling');
    rollBtn.disabled = true;

    // Animate dice roll
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        diceValue.textContent = randomValue;
        rollCount++;

        if (rollCount >= 10) {
            clearInterval(rollInterval);
            // Final dice value
            const finalValue = Math.floor(Math.random() * 6) + 1;
            diceValue.textContent = finalValue;
            gameState.diceValue = finalValue;

            setTimeout(() => {
                dice.classList.remove('rolling');
                gameState.isRolling = false;
                rollBtn.disabled = false;

                // Announce to screen reader
                announceToScreenReader(`Rolled a ${finalValue}`);

                // Enable valid pieces for current player
                highlightValidMoves();

                // If bot's turn, make move automatically
                if (gameState.players[gameState.currentPlayerIndex].isBot) {
                    setTimeout(() => makeBotMove(), 1000);
                }
            }, 300);
        }
    }, 100);
}

// Highlight pieces that can be moved
function highlightValidMoves() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const pieces = document.querySelectorAll(`.piece[data-player="${currentPlayer.id}"]`);

    pieces.forEach(piece => {
        const pieceId = parseInt(piece.dataset.piece);
        const pieceData = currentPlayer.pieces[pieceId];

        // Can move if: dice is 6 and piece is in home, or piece is on board
        const canMove = (gameState.diceValue === 6 && pieceData.inHome) || !pieceData.inHome;

        if (canMove) {
            piece.classList.add('active');
        } else {
            piece.classList.remove('active');
        }
    });
}

// Handle piece click
function handlePieceClick(piece) {
    const playerId = parseInt(piece.dataset.player);
    const pieceId = parseInt(piece.dataset.piece);

    // Check if it's the current player's turn
    if (playerId !== gameState.currentPlayerIndex) {
        announceToScreenReader("It's not your turn!");
        return;
    }

    // Check if dice has been rolled
    if (gameState.diceValue === null) {
        announceToScreenReader("Please roll the dice first!");
        return;
    }

    // Check if piece can be moved
    if (!piece.classList.contains('active')) {
        announceToScreenReader("This piece cannot be moved!");
        return;
    }

    // Move the piece
    movePiece(playerId, pieceId);
}

// Move a piece
function movePiece(playerId, pieceId) {
    const player = gameState.players[playerId];
    const piece = player.pieces[pieceId];

    if (piece.inHome && gameState.diceValue === 6) {
        // Move piece out of home
        piece.inHome = false;
        piece.position = 0;
        announceToScreenReader(`${player.name} moved piece ${pieceId + 1} out of home!`);
    } else if (!piece.inHome) {
        // Move piece on board
        piece.position += gameState.diceValue;
        announceToScreenReader(`${player.name} moved piece ${pieceId + 1} by ${gameState.diceValue} spaces`);
    }

    // Clear highlights
    document.querySelectorAll('.piece.active').forEach(p => p.classList.remove('active'));

    // Check if player gets another turn (rolled a 6)
    if (gameState.diceValue === 6) {
        announceToScreenReader("You rolled a 6! Roll again!");
        gameState.diceValue = null;
    } else {
        // Next player's turn
        nextTurn();
    }
}

// Bot makes a move
function makeBotMove() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const validPieces = currentPlayer.pieces.filter((piece, idx) => {
        return (gameState.diceValue === 6 && piece.inHome) || !piece.inHome;
    });

    if (validPieces.length > 0) {
        // Simple AI: choose random valid piece
        const randomPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
        const pieceId = currentPlayer.pieces.indexOf(randomPiece);
        movePiece(currentPlayer.id, pieceId);
    } else {
        // No valid moves
        announceToScreenReader(`${currentPlayer.name} has no valid moves`);
        nextTurn();
    }
}

// Move to next player's turn
function nextTurn() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 4;
    gameState.diceValue = null;
    updateCurrentPlayerDisplay();

    // If next player is bot, trigger their turn
    if (gameState.players[gameState.currentPlayerIndex].isBot) {
        setTimeout(() => {
            announceToScreenReader(`${gameState.players[gameState.currentPlayerIndex].name}'s turn`);
        }, 500);
    }
}

// Update current player display
function updateCurrentPlayerDisplay() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const nameElement = document.getElementById('current-player-name');
    nameElement.textContent = currentPlayer.name;

    // Update player list highlighting
    const playerItems = document.querySelectorAll('.player-item');
    playerItems.forEach((item, index) => {
        if (index === gameState.currentPlayerIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Render players list
function renderPlayersList() {
    const container = document.getElementById('players-list');
    container.innerHTML = '';

    const colorMap = {
        'red': '#b967ff',
        'blue': '#05d9e8',
        'green': '#ffd700',
        'yellow': '#f0f0f0'
    };

    gameState.players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'player-item';
        if (index === gameState.currentPlayerIndex) {
            item.classList.add('active');
        }

        const indicator = document.createElement('div');
        indicator.className = 'player-indicator';
        indicator.style.backgroundColor = colorMap[player.color];
        indicator.style.borderColor = colorMap[player.color];

        const name = document.createElement('span');
        name.className = 'player-item-name';
        name.textContent = player.name + (player.isBot ? ' (Bot)' : '');

        item.appendChild(indicator);
        item.appendChild(name);
        container.appendChild(item);
    });
}

// Pause game
function pauseGame() {
    // TODO: Implement pause functionality
    announceToScreenReader('Game paused');
    alert('Game paused! (Pause functionality will be implemented)');
}

// Quit game
function quitGame() {
    const confirmed = confirm('Are you sure you want to quit the game?');
    if (confirmed) {
        window.location.href = 'index.html';
    }
}

// Toggle menu
function toggleMenu() {
    // TODO: Implement menu toggle
    announceToScreenReader('Menu opened');
    alert('Menu (Will be implemented)');
}

// Screen reader announcement utility
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Add visually-hidden class for screen reader announcements
const style = document.createElement('style');
style.textContent = `
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
`;
document.head.appendChild(style);
