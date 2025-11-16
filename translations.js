// Translations for English, Hindi, and Arabic
const translations = {
    en: {
        gameTitle: "🎲 Ludo Universe",
        gameSubtitle: "An accessible multiplayer Ludo experience",
        language: "Language",
        selectLanguage: "Select your preferred language",
        languageHelper: "Choose your preferred language for the game",
        numberOfBots: "Number of Bots",
        selectBotCount: "Select how many computer-controlled players",
        botHelper: "Computer-controlled players (0-4 bots allowed)",
        playerConfiguration: "Player Configuration",
        player: "Player",
        name: "Name",
        enterName: "Enter your name",
        color: "Color",
        selectColor: "Select your color",
        red: "Red",
        blue: "Blue",
        green: "Green",
        yellow: "Yellow",
        startGame: "🎮 Start Game",
        startGameDesc: "Begin playing Ludo with your current configuration",
        accessibilityOptions: "Accessibility Options",
        highContrast: "High Contrast Mode",
        screenReaderMode: "Enhanced Screen Reader Support",
        keyboardHints: "Show Keyboard Shortcuts",
        errorPlayerName: "Please enter a name for Player",
        errorDuplicateColors: "Each player must have a unique color",
        errorNoPlayers: "At least one human player is required"
    },
    hi: {
        gameTitle: "🎲 लूडो यूनिवर्स",
        gameSubtitle: "एक सुलभ बहुखिलाड़ी लूडो अनुभव",
        language: "भाषा",
        selectLanguage: "अपनी पसंदीदा भाषा चुनें",
        languageHelper: "खेल के लिए अपनी पसंदीदा भाषा चुनें",
        numberOfBots: "बॉट्स की संख्या",
        selectBotCount: "कंप्यूटर-नियंत्रित खिलाड़ियों की संख्या चुनें",
        botHelper: "कंप्यूटर-नियंत्रित खिलाड़ी (0-4 बॉट्स अनुमत हैं)",
        playerConfiguration: "खिलाड़ी विन्यास",
        player: "खिलाड़ी",
        name: "नाम",
        enterName: "अपना नाम दर्ज करें",
        color: "रंग",
        selectColor: "अपना रंग चुनें",
        red: "लाल",
        blue: "नीला",
        green: "हरा",
        yellow: "पीला",
        startGame: "🎮 खेल शुरू करें",
        startGameDesc: "अपनी वर्तमान सेटिंग्स के साथ लूडो खेलना शुरू करें",
        accessibilityOptions: "सुगम्यता विकल्प",
        highContrast: "उच्च कंट्रास्ट मोड",
        screenReaderMode: "उन्नत स्क्रीन रीडर समर्थन",
        keyboardHints: "कीबोर्ड शॉर्टकट दिखाएं",
        errorPlayerName: "कृपया खिलाड़ी के लिए नाम दर्ज करें",
        errorDuplicateColors: "प्रत्येक खिलाड़ी का रंग अलग होना चाहिए",
        errorNoPlayers: "कम से कम एक मानव खिलाड़ी आवश्यक है"
    },
    ar: {
        gameTitle: "🎲 عالم لودو",
        gameSubtitle: "تجربة لودو متعددة اللاعبين يسهل الوصول إليها",
        language: "اللغة",
        selectLanguage: "اختر لغتك المفضلة",
        languageHelper: "اختر لغتك المفضلة للعبة",
        numberOfBots: "عدد الروبوتات",
        selectBotCount: "اختر عدد اللاعبين المتحكم فيهم بواسطة الكمبيوتر",
        botHelper: "اللاعبون المتحكم فيهم بالكمبيوتر (0-4 روبوتات مسموح بها)",
        playerConfiguration: "إعداد اللاعبين",
        player: "لاعب",
        name: "الاسم",
        enterName: "أدخل اسمك",
        color: "اللون",
        selectColor: "اختر لونك",
        red: "أحمر",
        blue: "أزرق",
        green: "أخضر",
        yellow: "أصفر",
        startGame: "🎮 ابدأ اللعبة",
        startGameDesc: "ابدأ لعب لودو بالإعدادات الحالية",
        accessibilityOptions: "خيارات إمكانية الوصول",
        highContrast: "وضع التباين العالي",
        screenReaderMode: "دعم محسّن لقارئ الشاشة",
        keyboardHints: "عرض اختصارات لوحة المفاتيح",
        errorPlayerName: "الرجاء إدخال اسم للاعب",
        errorDuplicateColors: "يجب أن يكون لكل لاعب لون فريد",
        errorNoPlayers: "مطلوب لاعب بشري واحد على الأقل"
    }
};

// Current language state
let currentLanguage = 'en';

// Get translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Update all translatable elements
function updateTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Update player card headings (Player 1, Player 2, etc)
    const playerCards = document.querySelectorAll('.player-card h3');
    playerCards.forEach((heading, index) => {
        heading.textContent = `${t('player')} ${index + 1}`;
    });
    
    // Update "Name" labels
    const nameLabels = document.querySelectorAll('.player-card-field label.player-card-label');
    nameLabels.forEach(label => {
        label.textContent = t('name');
    });
    
    // Update "Color" labels
    const colorLabels = document.querySelectorAll('.player-card-field p.player-card-label');
    colorLabels.forEach(label => {
        label.textContent = t('color');
    });
    
    // Update placeholders
    const playerNameInputs = document.querySelectorAll('.player-name-input');
    playerNameInputs.forEach((input, index) => {
        input.placeholder = `${t('enterName')} (${t('player')} ${index + 1})`;
    });
    
    // Update color button aria-labels
    const colorButtons = document.querySelectorAll('.color-button');
    colorButtons.forEach(button => {
        const color = button.getAttribute('data-color');
        button.setAttribute('aria-label', `${t(color)} ${t('color')}`);
    });
    
    // Update document language and direction
    const html = document.documentElement;
    html.lang = currentLanguage;
    
    if (currentLanguage === 'ar') {
        html.setAttribute('dir', 'rtl');
    } else {
        html.setAttribute('dir', 'ltr');
    }
}

// Change language function
function changeLanguage(lang) {
    currentLanguage = lang;
    updateTranslations();
    
    // Re-render player cards if they exist (defined in menu.js)
    if (typeof renderPlayerConfig === 'function') {
        renderPlayerConfig();
    }
    
    // Announce language change to screen readers
    announceToScreenReader(`${t('language')} ${t('selectLanguage')}`);
}

// Announce to screen reader
function announceToScreenReader(message) {
    const announcement = document.getElementById('player-count-announce');
    if (announcement) {
        announcement.textContent = message;
        setTimeout(() => {
            announcement.textContent = '';
        }, 1000);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, t, updateTranslations, changeLanguage };
}
