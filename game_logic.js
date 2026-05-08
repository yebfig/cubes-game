
const GAME_RULES = Object.freeze({
    defaultPlayers: 2,
    minPlayers: 2,
    maxPlayers: 6,
    minNumber: 1,
    maxNumber: 12,
    diceCount: 2,
    diceSides: 6
});

function normalizePlayerCount(count) {
    const parsed = Number.parseInt(count, 10);
    if (Number.isNaN(parsed)) return GAME_RULES.defaultPlayers;
    return Math.min(GAME_RULES.maxPlayers, Math.max(GAME_RULES.minPlayers, parsed));
}

function createPlayerNumbers() {
    const numbers = [];
    for (let value = GAME_RULES.minNumber; value <= GAME_RULES.maxNumber; value += 1) {
        numbers.push({ value, removed: false });
    }
    return numbers;
}

function createGameEngine() {
    const state = {
        players: [],
        currentPlayer: 0,
        active: false
    };

    function reset(playerCount = GAME_RULES.defaultPlayers) {
        const normalizedCount = normalizePlayerCount(playerCount);
        state.players = Array.from({ length: normalizedCount }, () => ({
            numbers: createPlayerNumbers()
        }));
        state.currentPlayer = 0;
        state.active = true;
        return getState();
    }

    function rollDie() {
        return Math.floor(Math.random() * GAME_RULES.diceSides) + 1;
    }

    function rollDice() {
        if (!state.active) return [];
        return Array.from({ length: GAME_RULES.diceCount }, () => rollDie());
    }

    function getCurrentPlayer() {
        return state.players[state.currentPlayer];
    }

    function hasValue(value) {
        const player = getCurrentPlayer();
        return player.numbers.some((number) => number.value === value && !number.removed);
    }

    function canRemove(values) {
        if (!state.active || !Array.isArray(values) || values.length === 0) return false;
        return values.every((value) => hasValue(value));
    }

    function remove(values) {
        if (!canRemove(values)) return [];
        const player = getCurrentPlayer();
        const uniqueValues = [...new Set(values)];
        const removedNow = [];

        for (const number of player.numbers) {
            if (uniqueValues.includes(number.value) && !number.removed) {
                number.removed = true;
                removedNow.push(number.value);
            }
        }

        return removedNow;
    }

    function getRemainingCount(playerIndex = state.currentPlayer) {
        const player = state.players[playerIndex];
        if (!player) return 0;
        return player.numbers.filter((number) => !number.removed).length;
    }

    function isCurrentPlayerWinner() {
        return getRemainingCount(state.currentPlayer) === 0;
    }

    function nextPlayer() {
        state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    }

    function stop() {
        state.active = false;
    }

    function getState() {
        return state;
    }

    return {
        rules: GAME_RULES,
        reset,
        rollDice,
        canRemove,
        remove,
        nextPlayer,
        stop,
        getState,
        getCurrentPlayer,
        getRemainingCount,
        isCurrentPlayerWinner,
        normalizePlayerCount
    };
}

window.CubesGame = createGameEngine();