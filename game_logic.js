
/**
 * @typedef {Object} NumberCard
 * @property {number} value - Число от 1 до 12.
 * @property {boolean} removed - Убрано ли число игроком.
 */

/**
 * @typedef {Object} Player
 * @property {NumberCard[]} numbers - Набор чисел игрока (1..12).
 */

/**
 * @typedef {Object} GameState
 * @property {Player[]} players - Список игроков.
 * @property {number} currentPlayer - Индекс текущего игрока.
 * @property {boolean} active - Флаг, активна ли игра (после победы выключается).
 */

/**
 * Глобальное состояние игры (на весь модуль).
 * @type {GameState}
 */
const game = {
    players: [],
    currentPlayer: 0,
    active: false
};


/**
 * Инициализирует новую игру с заданным числом игроков.
 * Создаёт каждому игроку числа 1..12 (каждое встречается один раз).
 *
 * @param {number} [count=2] - Количество игроков.
 * @returns {void}
 */
function initGame(count = 2) {
    game.players = [];

    for (let i = 0; i < count; i++) {
        const numbers = [];
        for (let n = 1; n <= 12; n++) {
            numbers.push({
                value: n,
                removed: false
            });
        }

        game.players.push({
            numbers
        });
    }

    game.currentPlayer = 0;
    game.active = true;
}


/**
 * Бросает один шестигранный кубик.
 * @returns {number} Значение от 1 до 6.
 */
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

/**
 * Бросает два кубика.
 * @returns {[number, number]} Пара значений от 1 до 6.
 */
function rollTwoDice() {
    return [rollDice(), rollDice()];
}

// =======================
// RULES
// =======================

/**
 * Проверяет, можно ли выполнить ход: убрать числа, соответствующие броску.
 *
 * Правило для дублей: если на кубиках одинаковые значения, нужно (и можно) убрать только одно число.
 * Для двух разных значений: если передано два числа, достаточно чтобы существовало хотя бы одно из них.
 * Для суммы (одно число): оно должно существовать.
 *
 * @param {number[]} cards - Список значений, которые игрок пытается убрать.
 * @returns {boolean} Можно ли сделать ход в текущем состоянии игры.
 */
function canRemoveNumbers(cards) {
    if (!game.active) return false;
    const player = game.players[game.currentPlayer];

    // numbers 1..12 exist only once per player;
    // treat duplicates in cards as a single requirement.
    const required = [];
    for (const v of cards) {
        if (!required.includes(v)) required.push(v);
    }

    // If one number was provided (sum move), it must exist.
    // If two numbers were provided (dice move), at least one must exist.
    if (required.length <= 1) {
        return required.every(v =>
            player.numbers.some(n => n.value === v && !n.removed)
        );
    }

    return required.some(v =>
        player.numbers.some(n => n.value === v && !n.removed)
    );
}

/**
 * Убирает подходящие числа у текущего игрока (если ход возможен).
 * Возвращает фактически убранные значения (для UI/анимаций).
 *
 * @param {number[]} cards - Запрошенные значения для удаления.
 * @returns {number[]} Список реально убранных значений (может быть пустым).
 */
function removeNumbers(cards) {
    if (!game.active) return [];

    const player = game.players[game.currentPlayer];

    if (!canRemoveNumbers(cards)) return [];

    const required = [];
    for (const v of cards) {
        if (!required.includes(v)) required.push(v);
    }
    let removedNow = [];

    player.numbers.forEach(n => {
        if (required.includes(n.value) && !n.removed) {
            n.removed = true;
            removedNow.push(n.value); // ✅ запоминаем
        }
    });

    return removedNow;
}

/**
 * Переключает ход на следующего игрока по кругу.
 * @returns {void}
 */
function nextPlayer() {
    game.currentPlayer =
        (game.currentPlayer + 1) % game.players.length;
}

// =======================
// WIN CHECK
// =======================

/**
 * Проверяет победу текущего игрока: все числа 1..12 убраны.
 * @returns {boolean}
 */
function checkWin() {
    const player = game.players[game.currentPlayer];
    return player.numbers.every(n => n.removed);
}

// =======================
// GETTERS
// =======================

/**
 * Возвращает объект состояния игры (по ссылке).
 * @returns {GameState}
 */
function getGame() {
    return game;
}

/**
 * Возвращает текущего игрока (по ссылке).
 * @returns {Player}
 */
function getCurrentPlayer() {
    return game.players[game.currentPlayer];
}

/**
 * Сбрасывает и запускает игру заново.
 * @param {number} [count=2] - Количество игроков.
 * @returns {void}
 */
function resetGame(count = 2) {
    initGame(count);
}