// Game state - Fixed to 4 players only
const gameState = {
    playerCount: 4, // Always 4 players
    botCount: 0,
    playerNames: ['', '', '', ''],
    selectedColors: ['red', 'blue', 'green', 'yellow'],
    highContrast: false,
    screenReaderMode: true,
    keyboardHints: true
};

const AVAILABLE_COLORS = ['red', 'blue', 'green', 'yellow'];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderPlayerConfig();
    updateTranslations();
    initializeMusic();
});

// Setup all event listeners
function setupEventListeners() {
    // Language selection
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });



    // Bot count selection
    const botCountSelect = document.getElementById('bot-count');
    botCountSelect.addEventListener('change', (e) => {
        gameState.botCount = parseInt(e.target.value);
        renderPlayerConfig();
        announceToScreenReader(`${gameState.botCount} ${t('numberOfBots')}`);
    });

    // High contrast toggle
    const highContrastCheckbox = document.getElementById('high-contrast');
    highContrastCheckbox.addEventListener('change', (e) => {
        gameState.highContrast = e.target.checked;
        document.body.classList.toggle('high-contrast', e.target.checked);
        announceToScreenReader(t('highContrast') + (e.target.checked ? ' enabled' : ' disabled'));
    });

    // Form submission
    const form = document.getElementById('game-config-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        validateAndStartGame();
    });
}

// Update bot count options based on player count
function updateBotCountOptions() {
    const botCountSelect = document.getElementById('bot-count');
    botCountSelect.innerHTML = '';
    
    for (let i = 0; i <= gameState.playerCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        botCountSelect.appendChild(option);
    }
    
    // Reset bot count if it exceeds new player count
    if (gameState.botCount > gameState.playerCount) {
        gameState.botCount = 0;
        botCountSelect.value = '0';
    } else {
        botCountSelect.value = gameState.botCount.toString();
    }
}

// Render player configuration cards
function renderPlayerConfig() {
    const container = document.getElementById('players-container');
    container.innerHTML = '';
    
    const humanPlayerCount = gameState.playerCount - gameState.botCount;
    
    for (let i = 0; i < humanPlayerCount; i++) {
        const playerCard = createPlayerCard(i);
        container.appendChild(playerCard);
    }
}

// Create a player configuration card
function createPlayerCard(index) {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-labelledby', `player-${index}-heading`);
    
    const heading = document.createElement('h3');
    heading.id = `player-${index}-heading`;
    heading.textContent = `${t('player')} ${index + 1}`;
    card.appendChild(heading);
    
    // Name field
    const nameField = createNameField(index);
    card.appendChild(nameField);
    
    // Color selection
    const colorField = createColorField(index);
    card.appendChild(colorField);
    
    return card;
}

// Create name input field
function createNameField(index) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'player-card-field';
    
    const label = document.createElement('label');
    label.htmlFor = `player-name-${index}`;
    label.className = 'player-card-label';
    label.textContent = t('name');
    fieldDiv.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `player-name-${index}`;
    input.className = 'player-name-input';
    input.placeholder = `${t('enterName')} (${t('player')} ${index + 1})`;
    input.value = gameState.playerNames[index] || '';
    input.setAttribute('aria-required', 'true');
    
    input.addEventListener('input', (e) => {
        gameState.playerNames[index] = e.target.value;
    });
    
    fieldDiv.appendChild(input);
    return fieldDiv;
}

// Create color selection field
function createColorField(index) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'player-card-field';
    
    const label = document.createElement('p');
    label.className = 'player-card-label';
    label.textContent = t('color');
    fieldDiv.appendChild(label);
    
    const colorGrid = document.createElement('div');
    colorGrid.className = 'color-selection';
    colorGrid.setAttribute('role', 'radiogroup');
    colorGrid.setAttribute('aria-label', `${t('selectColor')} ${t('player')} ${index + 1}`);
    
    const colorsToShow = AVAILABLE_COLORS.slice(0, gameState.playerCount);
    
    colorsToShow.forEach(color => {
        const colorButton = createColorButton(color, index);
        colorGrid.appendChild(colorButton);
    });
    
    fieldDiv.appendChild(colorGrid);
    return fieldDiv;
}

// Create color selection button
function createColorButton(color, playerIndex) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-button';
    button.setAttribute('data-color', color);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', `${t(color)} ${t('color')}`);
    
    // Check if this color is selected by this player
    const isSelected = gameState.selectedColors[playerIndex] === color;
    button.setAttribute('aria-checked', isSelected.toString());
    
    if (isSelected) {
        button.classList.add('selected');
    }
    
    // Check if this color is used by another player
    const isUsedByOther = gameState.selectedColors.some((c, i) => i !== playerIndex && c === color && i < gameState.playerCount - gameState.botCount);
    
    if (isUsedByOther) {
        button.classList.add('disabled');
        button.disabled = true;
    }
    
    // Add emoji to make it more visual
    const colorEmojis = {
        red: '🔴',
        blue: '🔵',
        green: '🟢',
        yellow: '🟡',
        purple: '🟣',
        orange: '🟠'
    };
    
    button.textContent = colorEmojis[color] || color;
    
    button.addEventListener('click', () => {
        if (!isUsedByOther) {
            gameState.selectedColors[playerIndex] = color;
            renderPlayerConfig();
            announceToScreenReader(`${t('player')} ${playerIndex + 1} ${t('color')} ${t(color)}`);
        }
    });
    
    return button;
}

// Validate form and start game
function validateAndStartGame() {
    const errors = [];
    const humanPlayerCount = gameState.playerCount - gameState.botCount;
    
    // Validate player names
    for (let i = 0; i < humanPlayerCount; i++) {
        if (!gameState.playerNames[i] || gameState.playerNames[i].trim() === '') {
            errors.push(`${t('errorPlayerName')} ${i + 1}`);
        }
    }
    
    // Validate colors are unique
    const usedColors = gameState.selectedColors.slice(0, gameState.playerCount);
    const uniqueColors = new Set(usedColors);
    if (uniqueColors.size !== gameState.playerCount) {
        errors.push(t('errorDuplicateColors'));
    }
    
    // Check at least one human player
    if (humanPlayerCount === 0) {
        errors.push(t('errorNoPlayers'));
    }
    
    const errorContainer = document.getElementById('error-container');
    
    if (errors.length > 0) {
        displayErrors(errors);
        // Focus on first error
        errorContainer.focus();
        return;
    }
    
    // Clear errors
    errorContainer.classList.remove('visible');
    errorContainer.innerHTML = '';
    
    // Save configuration
    const config = {
        playerCount: gameState.playerCount,
        botCount: gameState.botCount,
        playerNames: gameState.playerNames.slice(0, humanPlayerCount),
        playerColors: gameState.selectedColors.slice(0, gameState.playerCount),
        language: currentLanguage,
        highContrast: gameState.highContrast,
        screenReaderMode: gameState.screenReaderMode,
        keyboardHints: gameState.keyboardHints
    };
    
    localStorage.setItem('ludoConfig', JSON.stringify(config));
    
    // Announce success
    announceToScreenReader('Game starting!');

    // Navigate to game page
    window.location.href = 'game.html';
}

// Display validation errors
function displayErrors(errors) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.classList.add('visible');
    errorContainer.setAttribute('tabindex', '-1');
    
    const errorList = document.createElement('ul');
    errorList.className = 'error-list';
    
    errors.forEach(error => {
        const errorItem = document.createElement('li');
        errorItem.className = 'error-item';
        errorItem.textContent = error;
        errorList.appendChild(errorItem);
    });
    
    errorContainer.innerHTML = '';
    errorContainer.appendChild(errorList);
    
    // Announce errors to screen reader
    announceToScreenReader(`${errors.length} errors found. ${errors.join('. ')}`);
}

// Initialize the page
updateBotCountOptions();

// Music control functionality
function initializeMusic() {
    const audio = document.getElementById('menu-music');
    const toggleBtn = document.getElementById('music-toggle');
    const musicIcon = document.querySelector('.music-icon');

    let isMuted = false;

    // Try to autoplay music
    // Note: Some browsers require user interaction first
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Autoplay started successfully
            console.log('Music started playing');
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
