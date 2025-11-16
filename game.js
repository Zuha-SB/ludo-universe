// Game State
const gameState = {
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    isRolling: false,
    isBotRolling: false,
    gameStarted: false
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadGameConfig();
    initializeGame();
    setupEventListeners();
    initializeMusic();
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
    generateBoardPath();
    renderPlayersList();

    // Update positions of any pieces already on the board
    gameState.players.forEach((player, playerId) => {
        player.pieces.forEach((piece, pieceId) => {
            if (!piece.inHome) {
                updatePiecePosition(playerId, pieceId);
            }
        });
    });

    gameState.gameStarted = true;

    // If first player is a bot, trigger their turn automatically
    const firstPlayer = gameState.players[gameState.currentPlayerIndex];
    if (firstPlayer.isBot) {
        setTimeout(() => {
            announceToScreenReader(`${firstPlayer.name}'s turn`);
            setTimeout(() => {
                gameState.isBotRolling = true;
                rollDice();
                gameState.isBotRolling = false;
            }, 1000);
        }, 1000);
    }
}

// Generate the Ludo board path
function generateBoardPath() {
    const boardPath = document.querySelector('.board-path');

    // Create the cross-shaped board with 52 cells around the perimeter
    // Plus 4 home stretches of 6 cells each leading to the center

    // The board is divided into 4 arms (top, right, bottom, left)
    // Each arm has 3 rows and 6 columns (or vice versa)

    const colors = ['nebula', 'plasma', 'solar', 'comet']; // purple, blue, gold, white
    const startPositions = [1, 14, 27, 40]; // Starting cell for each player
    const safePositions = [1, 9, 14, 22, 27, 35, 40, 48]; // Safe positions

    // Create all 52 board cells plus home stretches
    for (let i = 0; i < 52; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.position = i;

        // Mark starting positions
        if (startPositions.includes(i)) {
            cell.classList.add('start-position');
            const playerIndex = startPositions.indexOf(i);
            cell.classList.add(`start-${colors[playerIndex]}`);
        }

        // Mark safe positions
        if (safePositions.includes(i)) {
            cell.classList.add('safe-position');
        }

        boardPath.appendChild(cell);
    }

    // Create home stretch paths for each player (leading to center)
    colors.forEach((color, index) => {
        const homeStretch = document.createElement('div');
        homeStretch.className = `home-stretch home-stretch-${color}`;

        for (let i = 0; i < 6; i++) {
            const cell = document.createElement('div');
            cell.className = 'home-stretch-cell';
            cell.dataset.player = index;
            cell.dataset.stretchPosition = i;
            homeStretch.appendChild(cell);
        }

        boardPath.appendChild(homeStretch);
    });

    // Create center finish area
    const center = document.createElement('div');
    center.className = 'center-finish';
    center.innerHTML = '<div class="center-star">★</div>';
    boardPath.appendChild(center);
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

    // Prevent user from rolling for bots
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isBot && !gameState.isBotRolling) {
        announceToScreenReader("It's the bot's turn! Please wait.");
        return;
    }

    // Prevent rolling if dice has already been rolled (waiting for piece move)
    if (gameState.diceValue !== null && !gameState.isBotRolling) {
        announceToScreenReader("Please move a piece first!");
        return;
    }

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

                // Keep button disabled after rolling (until piece is moved)
                const currentPlayer = gameState.players[gameState.currentPlayerIndex];
                rollBtn.disabled = true;
                if (currentPlayer.isBot) {
                    rollBtn.textContent = "BOT'S TURN";
                } else {
                    rollBtn.textContent = "MOVE A PIECE";
                }

                // Announce to screen reader
                announceToScreenReader(`Rolled a ${finalValue}`);

                // Enable valid pieces for current player
                highlightValidMoves();

                // Check if player has any valid moves
                if (!hasValidMoves()) {
                    // No valid moves, automatically skip turn
                    announceToScreenReader(`${currentPlayer.name} has no valid moves. Skipping turn.`);
                    setTimeout(() => nextTurn(), 1500);
                } else {
                    // If bot's turn, make move automatically
                    if (currentPlayer.isBot) {
                        setTimeout(() => makeBotMove(), 1000);
                    }
                }
            }, 300);
        }
    }, 100);
}

// Check if current player has any valid moves
function hasValidMoves() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Check if any piece can be moved
    for (const piece of currentPlayer.pieces) {
        // Can move if: dice is 6 and piece is in home, or piece is on board
        const canMove = (gameState.diceValue === 6 && piece.inHome) || !piece.inHome;
        if (canMove) {
            return true;
        }
    }

    return false;
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
        // Each player starts at a different position: 0, 13, 26, 39
        const startPositions = [1, 14, 27, 40];
        piece.position = startPositions[playerId];
        announceToScreenReader(`${player.name} moved piece ${pieceId + 1} out of home!`);
    } else if (!piece.inHome) {
        // Move piece on board
        piece.position = (piece.position + gameState.diceValue) % 52;
        announceToScreenReader(`${player.name} moved piece ${pieceId + 1} by ${gameState.diceValue} spaces`);
    }

    // Update visual position of piece
    updatePiecePosition(playerId, pieceId);

    // Clear highlights
    document.querySelectorAll('.piece.active').forEach(p => p.classList.remove('active'));

    // Check if player gets another turn (rolled a 6)
    if (gameState.diceValue === 6) {
        announceToScreenReader(`${player.name} rolled a 6! Roll again!`);
        gameState.diceValue = null;

        // If current player is a bot, automatically roll again
        if (player.isBot) {
            setTimeout(() => {
                gameState.isBotRolling = true;
                rollDice();
                gameState.isBotRolling = false;
            }, 1500);
        } else {
            // Re-enable roll button for human player who got a 6
            const rollBtn = document.getElementById('roll-btn');
            if (rollBtn) {
                rollBtn.disabled = false;
                rollBtn.textContent = "ROLL DICE";
            }
        }
    } else {
        // Next player's turn
        nextTurn();
    }
}

// Update the visual position of a piece on the board
function updatePiecePosition(playerId, pieceId) {
    const player = gameState.players[playerId];
    const piece = player.pieces[pieceId];
    const pieceElement = document.querySelector(`.piece[data-player="${playerId}"][data-piece="${pieceId}"]`);
    const board = document.querySelector('.ludo-board');

    if (piece.inHome) {
        // Piece is in home area, reset to sidebar position
        pieceElement.style.position = '';
        pieceElement.style.left = '';
        pieceElement.style.top = '';
        pieceElement.style.transform = '';
        pieceElement.style.zIndex = '';
        return;
    }

    // Find the board cell at this position
    const targetCell = document.querySelector(`.board-cell[data-position="${piece.position}"]`);

    if (targetCell && board) {
        // Move piece element to the board container if not already there
        if (pieceElement.parentElement !== board) {
            board.appendChild(pieceElement);
        }

        // Get the position of the target cell
        const cellRect = targetCell.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();

        // Calculate relative position
        const relativeX = cellRect.left - boardRect.left + (cellRect.width / 2);
        const relativeY = cellRect.top - boardRect.top + (cellRect.height / 2);

        // Move the piece to the board
        pieceElement.style.position = 'absolute';
        pieceElement.style.left = `${relativeX}px`;
        pieceElement.style.top = `${relativeY}px`;
        pieceElement.style.transform = 'translate(-50%, -50%)';
        pieceElement.style.zIndex = '100';
        pieceElement.style.transition = 'all 0.5s ease';
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

    // If next player is bot, trigger their turn automatically
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isBot) {
        // Disable the roll button for bot turns
        const rollBtn = document.getElementById('roll-btn');
        const dice = document.getElementById('dice');
        if (rollBtn) rollBtn.disabled = true;
        if (dice) dice.style.cursor = 'not-allowed';

        setTimeout(() => {
            announceToScreenReader(`${currentPlayer.name}'s turn`);
            // Automatically roll dice for bot after a delay
            setTimeout(() => {
                gameState.isBotRolling = true;
                rollDice();
                gameState.isBotRolling = false;
            }, 1000);
        }, 500);
    } else {
        // Enable the roll button for human players
        const rollBtn = document.getElementById('roll-btn');
        const dice = document.getElementById('dice');
        if (rollBtn) rollBtn.disabled = false;
        if (dice) dice.style.cursor = 'pointer';
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

    // Update dice button state based on whether current player is bot
    const rollBtn = document.getElementById('roll-btn');
    const dice = document.getElementById('dice');
    if (currentPlayer.isBot) {
        if (rollBtn) {
            rollBtn.disabled = true;
            rollBtn.textContent = "BOT'S TURN";
        }
        if (dice) dice.style.cursor = 'not-allowed';
    } else {
        if (rollBtn) {
            rollBtn.disabled = false;
            rollBtn.textContent = "ROLL DICE";
        }
        if (dice) dice.style.cursor = 'pointer';
    }
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

// Music control functionality
function initializeMusic() {
    const audio = document.getElementById('game-music');
    const toggleBtn = document.getElementById('music-toggle');
    const musicIcon = document.querySelector('.music-icon');

    if (!audio || !toggleBtn || !musicIcon) return;

    let isMuted = false;

    // Try to autoplay music
    // Note: Some browsers require user interaction first
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Autoplay started successfully
            console.log('Game music started playing');
        }).catch(error => {
            // Autoplay was prevented
            console.log('Autoplay prevented, waiting for user interaction');
            isMuted = true;
            musicIcon.textContent = '🔇';
            toggleBtn.setAttribute('aria-label', 'Play background music');
        });
    }

    // Toggle music on button click
    toggleBtn.addEventListener('click', () => {
        if (isMuted || audio.paused) {
            audio.play();
            musicIcon.textContent = '🔊';
            toggleBtn.setAttribute('aria-label', 'Mute background music');
            isMuted = false;
            announceToScreenReader('Music playing');
        } else {
            audio.pause();
            musicIcon.textContent = '🔇';
            toggleBtn.setAttribute('aria-label', 'Play background music');
            isMuted = true;
            announceToScreenReader('Music muted');
        }
    });

    // Also allow keyboard control
    toggleBtn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBtn.click();
        }
    });
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
