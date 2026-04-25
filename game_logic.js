
const game = {
    players: [],
    currentPlayer: 0,
    active: false
};

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

function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollTwoDice() {
    return [rollDice(), rollDice()];
}

function canRemoveNumbers(cards) {
    if (!game.active) return false;
    const player = game.players[game.currentPlayer];

    const required = [];
    for (const v of cards) {
        if (!required.includes(v)) required.push(v);
    }

    if (required.length <= 1) {
        return required.every(v =>
            player.numbers.some(n => n.value === v && !n.removed)
        );
    }

    return required.some(v =>
        player.numbers.some(n => n.value === v && !n.removed)
    );
}

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
            removedNow.push(n.value); 
        }
    });

    return removedNow;
}

function nextPlayer() {
    game.currentPlayer =
        (game.currentPlayer + 1) % game.players.length;
}

function checkWin() {
    const player = game.players[game.currentPlayer];
    return player.numbers.every(n => n.removed);
}

function getGame() {
    return game;
}

function getCurrentPlayer() {
    return game.players[game.currentPlayer];
}

function resetGame(count = 2) {
    initGame(count);
}