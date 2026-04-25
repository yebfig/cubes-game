document.addEventListener("DOMContentLoaded", () => {
    showMenu();
});

function showMenu() {
    document.body.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = "🎲 Кубики Бали 🎲";

    const rules = document.createElement("div");
    rules.className = "rules";
    rules.innerHTML = `
        <h3>Как играть</h3>
        <ul>
            <li>В начале у каждого игрока есть числа от 1 до 12.</li>
            <li>На ходу игрок бросает 2 кубика.</li>
            <li>После броска можно убрать <b>одно</b> число (сумму) или убрать числа с кубиков (оба или одно, если одно уже убрано).</li>
            <li>Побеждает тот, кто первым уберёт все числа.</li>
        </ul>
    `;

    const menu = document.createElement("div");
    menu.id = "menu";

    const label = document.createElement("label");
    label.textContent = "Количество игроков: ";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "2";
    input.max = "6";
    input.value = "2";

    const btn = document.createElement("button");
    btn.textContent = "Новая игра";

    btn.onclick = () => startGame(parseInt(input.value));

    menu.append(label, input, btn);
    document.body.append(title, rules, menu);
}

function startGame(count) {
    playerCount = count;
    resetGame(count);

    document.body.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = "🎲 Кубики Бали 🎲";

    const playersBar = document.createElement("div");
    playersBar.id = "playersBar";

    const cards = document.createElement("div");
    cards.id = "cards";

    const container = document.createElement("div");
    container.id = "container";

    document.body.append(title, playersBar, cards, container);

    resetTurn();
    render();
}

function showWinner(winnerIndex) {
    // stop game actions
    getGame().active = false;

    const bar = document.querySelector("#playersBar");
    const cards = document.querySelector("#cards");
    const container = document.querySelector("#container");

    if (bar) bar.style.display = "none";
    if (cards) cards.style.display = "none";
    if (!container) return;

    container.innerHTML = "";
    container.classList.add("winner");

    const title = document.createElement("h3");
    title.textContent = `Победил игрок ${winnerIndex + 1}!`;

    const text = document.createElement("p");
    text.textContent = "Отличная игра. Сыграем ещё раз?";

    const again = document.createElement("button");
    again.textContent = "Новая игра";
    again.onclick = () => startGame(playerCount);

    const menu = document.createElement("button");
    menu.textContent = "В меню";
    menu.onclick = () => showMenu();

    container.append(title, text, again, menu);
}

function resetTurn() {
    dice = null;
    rolled = false;
    message = "";
}

function render() {
    renderPlayersBar();
    renderCards();
    renderTurn();
}

function renderPlayersBar() {
    const bar = document.querySelector("#playersBar");
    if (!bar) return;
    bar.innerHTML = "";

    const g = getGame();
    g.players.forEach((p, idx) => {
        const chip = document.createElement("div");
        chip.className = "playerChip";
        if (idx === g.currentPlayer) chip.classList.add("current");

        const left = p.numbers.filter(n => !n.removed).length;
        chip.textContent = `Игрок ${idx + 1}: ${left}/12`;
        bar.appendChild(chip);
    });
}

function renderCards() {
    const cards = document.querySelector("#cards");
    cards.innerHTML = "";

    const player = getCurrentPlayer();

    player.numbers.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.value;
        div.classList.add("card");

        if (n.removed) {
            div.classList.add("removed");

            if (lastRemoved.includes(n.value)) {
                div.classList.add("animate-remove");
            }
        }

        cards.appendChild(div);
    });
}

function renderTurn() {
    const container = document.querySelector("#container");
    animateContainerUpdate(container, () => {
        container.innerHTML = "";

        const playerIndex = getGame().currentPlayer;
        const player = getCurrentPlayer();

        const title = document.createElement("h3");
        title.textContent = `Ход игрока ${playerIndex + 1}`;

        const info = document.createElement("p");
        info.textContent = `Осталось: ${player.numbers.filter(n => !n.removed).length}`;

        const msg = document.createElement("div");
        msg.className = "message";
        msg.textContent = message || "";
        if (!message) msg.classList.add("hidden");

        container.append(title, info, msg);

        const actions = document.createElement("div");
        actions.className = "actions";

        if (!rolled) {
            const btn = document.createElement("button");
            btn.textContent = "🎲 Бросить кубики";

            btn.onclick = () => {
                dice = rollTwoDice();
                rolled = true;
                render();
            };

            actions.dataset.state = "roll";
            actions.appendChild(btn);
            container.appendChild(actions);
            requestAnimationFrame(() => actions.classList.add("enter"));
            return;
        }

        const diceInfo = document.createElement("p");
        diceInfo.textContent = `Кубики: ${dice[0]}, ${dice[1]}`;

        container.appendChild(diceInfo);

        const b1 = document.createElement("button");
        const d1 = dice[0];
        const d2 = dice[1];
        const diceValues = (d1 === d2) ? [d1] : [d1, d2];
        const availableDiceValues = diceValues.filter(v =>
            player.numbers.some(n => n.value === v && !n.removed)
        );

        if (availableDiceValues.length === 0) {
            b1.textContent = diceValues.length === 1
                ? `Убрать ${diceValues[0]}`
                : `Убрать ${diceValues[0]} и ${diceValues[1]}`;
            // allow click to show message from handleMove()
            b1.onclick = () => handleMove(diceValues);
        } else if (availableDiceValues.length === 1) {
            b1.textContent = `Убрать ${availableDiceValues[0]}`;
            b1.onclick = () => handleMove(availableDiceValues);
        } else {
            b1.textContent = `Убрать ${availableDiceValues[0]} и ${availableDiceValues[1]}`;
            b1.onclick = () => handleMove(availableDiceValues);
        }

        const b2 = document.createElement("button");
        b2.textContent = `Убрать ${dice[0] + dice[1]}`;
        b2.onclick = () => handleMove([dice[0] + dice[1]]);

        const b3 = document.createElement("button");
        b3.textContent = "Пропустить ход";
        b3.onclick = () => {
            nextPlayer();
            resetTurn();
            render();
        };

        actions.dataset.state = "choose";
        actions.append(b1, b2, b3);
        container.appendChild(actions);
        requestAnimationFrame(() => actions.classList.add("enter"));
    });
}

function animateContainerUpdate(container, updateFn) {
    if (!container) return;

    const oldActions = container.querySelector(".actions");
    if (oldActions) {
        oldActions.classList.remove("enter");
        oldActions.classList.add("exit");
    }

    // Lock current height so we can animate to new one.
    const startHeight = container.offsetHeight;
    container.style.height = startHeight + "px";
    container.style.overflow = "hidden";

    const doUpdate = () => {
        updateFn();

        // Next frame: animate to the new height.
        requestAnimationFrame(() => {
            const endHeight = container.scrollHeight;
            // Do not shrink the panel: keep at least the previous height.
            const targetHeight = Math.max(startHeight, endHeight);
            container.style.height = targetHeight + "px";

            const onEnd = (e) => {
                if (e.propertyName !== "height") return;
                // Keep fixed height so it doesn't shrink next renders.
                container.style.height = targetHeight + "px";
                container.style.overflow = "";
                container.removeEventListener("transitionend", onEnd);
            };

            container.addEventListener("transitionend", onEnd);
        });
    };

    // If we had buttons, let them fade out first.
    if (oldActions) {
        setTimeout(doUpdate, 160);
    } else {
        doUpdate();
    }
}

function handleMove(cards) {
    const removed = removeNumbers(cards);

    if (removed.length === 0) {
        message = "Нельзя сделать этот ход: нужных чисел уже нет.";
        render();
        return;
    }

    lastRemoved = removed;
    message = "";

    render();

    if (checkWin()) {
        const winner = getGame().currentPlayer;
        setTimeout(() => showWinner(winner), 300);
        return;
    }

    setTimeout(() => {
        nextPlayer();
        resetTurn();
        lastRemoved = [];
        render();
    }, 600);
}