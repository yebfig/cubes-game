const { CubesGame } = window;
const { rules } = CubesGame;

const UI_TEXT = Object.freeze({
    title: "🎲 Кубики Бали 🎲",
    menuHeading: "Как играть",
    startButton: "Новая игра",
    menuButton: "В меню",
    rollButton: "🎲 Бросить кубики",
    skipButton: "Пропустить ход",
    invalidMove: "Этот ход недоступен: нужные числа уже сняты.",
    winnerText: "Отличная игра. Сыграем еще раз?"
});

const UI_DELAYS = Object.freeze({
    actionSwapMs: 160,
    winnerMs: 300,
    nextTurnMs: 600
});

const uiState = {
    playerCount: rules.defaultPlayers,
    dice: null,
    rolled: false,
    message: "",
    lastRemoved: []
};

document.addEventListener("DOMContentLoaded", () => {
    showMenu();
});

function showMenu() {
    document.body.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = UI_TEXT.title;

    const rulesBlock = document.createElement("div");
    rulesBlock.className = "rules";
    rulesBlock.innerHTML = `
        <h3>${UI_TEXT.menuHeading}</h3>
        <ul>
            <li>У каждого игрока есть числа от ${rules.minNumber} до ${rules.maxNumber}.</li>
            <li>В свой ход игрок бросает ${rules.diceCount} кубика d${rules.diceSides}.</li>
            <li>Можно убрать числа кубиков или одно число, равное их сумме.</li>
            <li>Побеждает тот, кто первым уберет все свои числа.</li>
        </ul>
    `;

    const menu = document.createElement("div");
    menu.id = "menu";

    const label = document.createElement("label");
    label.htmlFor = "playersInput";
    label.textContent = "Количество игроков:";

    const input = document.createElement("input");
    input.id = "playersInput";
    input.type = "number";
    input.min = String(rules.minPlayers);
    input.max = String(rules.maxPlayers);
    input.value = String(uiState.playerCount);

    const btn = document.createElement("button");
    btn.textContent = UI_TEXT.startButton;
    btn.onclick = () => {
        startGame(input.value);
    };

    menu.append(label, input, btn);
    document.body.append(title, rulesBlock, menu);
}

function startGame(playerCount) {
    uiState.playerCount = CubesGame.normalizePlayerCount(playerCount);
    CubesGame.reset(uiState.playerCount);
    resetTurnState();

    document.body.innerHTML = `
        <h1>${UI_TEXT.title}</h1>
        <div id="playersBar"></div>
        <div id="cards"></div>
        <div id="container"></div>
    `;

    render();
}

function showWinner(winnerIndex) {
    CubesGame.stop();

    const bar = document.querySelector("#playersBar");
    const cards = document.querySelector("#cards");
    const container = document.querySelector("#container");
    if (!container) return;

    if (bar) bar.style.display = "none";
    if (cards) cards.style.display = "none";

    container.innerHTML = "";
    container.classList.add("winner");

    const title = document.createElement("h3");
    title.textContent = `Победил игрок ${winnerIndex + 1}!`;

    const text = document.createElement("p");
    text.textContent = UI_TEXT.winnerText;

    const again = document.createElement("button");
    again.textContent = UI_TEXT.startButton;
    again.onclick = () => startGame(uiState.playerCount);

    const menuButton = document.createElement("button");
    menuButton.textContent = UI_TEXT.menuButton;
    menuButton.onclick = showMenu;

    container.append(title, text, again, menuButton);
}

function resetTurnState() {
    uiState.dice = null;
    uiState.rolled = false;
    uiState.message = "";
    uiState.lastRemoved = [];
}

function render() {
    renderPlayersBar();
    renderCards();
    renderTurn();
}

function renderPlayersBar() {
    const bar = document.querySelector("#playersBar");
    if (!bar) return;

    const game = CubesGame.getState();
    bar.innerHTML = "";

    game.players.forEach((_, index) => {
        const chip = document.createElement("div");
        chip.className = "playerChip";
        if (index === game.currentPlayer) chip.classList.add("current");

        const remaining = CubesGame.getRemainingCount(index);
        chip.textContent = `Игрок ${index + 1}: ${remaining}/${rules.maxNumber}`;
        bar.appendChild(chip);
    });
}

function renderCards() {
    const cards = document.querySelector("#cards");
    if (!cards) return;

    const player = CubesGame.getCurrentPlayer();
    cards.innerHTML = "";

    player.numbers.forEach((number) => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.textContent = String(number.value);

        if (number.removed) {
            card.classList.add("removed");
            if (uiState.lastRemoved.includes(number.value)) {
                card.classList.add("animate-remove");
            }
        }

        cards.appendChild(card);
    });
}

function renderTurn() {
    const container = document.querySelector("#container");
    if (!container) return;

    animateContainerUpdate(container, () => {
        const game = CubesGame.getState();
        const player = CubesGame.getCurrentPlayer();
        container.innerHTML = "";

        const title = document.createElement("h3");
        title.textContent = `Ход игрока ${game.currentPlayer + 1}`;

        const info = document.createElement("p");
        info.textContent = `Осталось чисел: ${CubesGame.getRemainingCount()}`;

        const message = document.createElement("div");
        message.className = "message";
        message.textContent = uiState.message;
        if (!uiState.message) message.classList.add("hidden");

        container.append(title, info, message);

        const actions = document.createElement("div");
        actions.className = "actions";

        if (!uiState.rolled) {
            const rollButton = document.createElement("button");
            rollButton.textContent = UI_TEXT.rollButton;
            rollButton.onclick = () => {
                uiState.dice = CubesGame.rollDice();
                uiState.rolled = true;
                uiState.lastRemoved = [];
                render();
            };

            actions.appendChild(rollButton);
            container.appendChild(actions);
            requestAnimationFrame(() => actions.classList.add("enter"));
            return;
        }

        const diceValues = getUniqueDiceValues(uiState.dice);
        const availableDiceValues = diceValues.filter((value) => CubesGame.canRemove([value]));
        const diceSum = uiState.dice.reduce((sum, value) => sum + value, 0);

        const diceInfo = document.createElement("p");
        diceInfo.textContent = `Кубики: ${uiState.dice.join(", ")} (сумма ${diceSum})`;
        container.appendChild(diceInfo);

        const removeDiceButton = document.createElement("button");
        removeDiceButton.textContent = buildRemoveDiceText(availableDiceValues, diceValues);
        removeDiceButton.onclick = () => handleMove(availableDiceValues);

        const removeSumButton = document.createElement("button");
        removeSumButton.textContent = `Убрать ${diceSum}`;
        removeSumButton.onclick = () => handleMove([diceSum]);

        const skipButton = document.createElement("button");
        skipButton.textContent = UI_TEXT.skipButton;
        skipButton.onclick = () => {
            CubesGame.nextPlayer();
            resetTurnState();
            render();
        };

        disableInvalidButton(removeDiceButton, availableDiceValues.length === 0);
        disableInvalidButton(removeSumButton, !CubesGame.canRemove([diceSum]));

        actions.append(removeDiceButton, removeSumButton, skipButton);
        container.appendChild(actions);
        requestAnimationFrame(() => actions.classList.add("enter"));
    });
}

function getUniqueDiceValues(diceValues) {
    return [...new Set(diceValues)];
}

function buildRemoveDiceText(availableValues, rolledValues) {
    if (availableValues.length === 0) {
        if (rolledValues.length === 1) return `Убрать ${rolledValues[0]}`;
        return `Убрать ${rolledValues[0]} и ${rolledValues[1]}`;
    }

    if (availableValues.length === 1) return `Убрать ${availableValues[0]}`;
    return `Убрать ${availableValues[0]} и ${availableValues[1]}`;
}

function disableInvalidButton(button, shouldDisable) {
    button.disabled = shouldDisable;
    if (shouldDisable) {
        button.classList.add("disabled");
    } else {
        button.classList.remove("disabled");
    }
}

function animateContainerUpdate(container, updateFn) {
    const oldActions = container.querySelector(".actions");
    if (oldActions) {
        oldActions.classList.remove("enter");
        oldActions.classList.add("exit");
    }

    const startHeight = container.offsetHeight;
    container.style.height = `${startHeight}px`;
    container.style.overflow = "hidden";

    const doUpdate = () => {
        updateFn();
        requestAnimationFrame(() => {
            const endHeight = container.scrollHeight;
            const targetHeight = Math.max(startHeight, endHeight);
            container.style.height = `${targetHeight}px`;

            const onEnd = (event) => {
                if (event.propertyName !== "height") return;
                container.style.height = `${targetHeight}px`;
                container.style.overflow = "";
                container.removeEventListener("transitionend", onEnd);
            };

            container.addEventListener("transitionend", onEnd);
        });
    };

    if (oldActions) {
        setTimeout(doUpdate, UI_DELAYS.actionSwapMs);
    } else {
        doUpdate();
    }
}

function handleMove(values) {
    const removed = CubesGame.remove(values);

    if (removed.length === 0) {
        uiState.message = UI_TEXT.invalidMove;
        render();
        return;
    }

    uiState.lastRemoved = removed;
    uiState.message = "";
    render();

    if (CubesGame.isCurrentPlayerWinner()) {
        const winner = CubesGame.getState().currentPlayer;
        setTimeout(() => showWinner(winner), UI_DELAYS.winnerMs);
        return;
    }

    setTimeout(() => {
        CubesGame.nextPlayer();
        resetTurnState();
        render();
    }, UI_DELAYS.nextTurnMs);
}