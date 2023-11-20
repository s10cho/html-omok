const range = function (n, m) {
    if (arguments.length === 1)
        return Array.from({length: n}).map((_, i) => i);

    if (arguments.length === 2) {
        if (n === m) return [n];
        else if (n < m) {
            return Array.from({length: m - n + 1}).map((_, i) => i + n);
        } else {
            return Array.from({length: n - m + 1}).map(
                (_, i) => m - i + (n - m)
            );
        }
    }
};

const repeat = (n) => (v) => Array.from({length: n}).map(() => v);

const zip = (arr1, arr2) => {
    const length = Math.min(arr1.length, arr2.length);
    return Array.from({length}).map((_, i) => [arr1[i], arr2[i]]);
};

const delay = (n) => new Promise((r) => setTimeout(r, n));

const createGrid = (n) =>
    Array.from({length: n}).map(() =>
        Array.from({length: n}).map(() => 0)
    );

const draw = (container, grid) => {
    container.innerHTML = grid.map(
        (row) =>
            `<div class="row">${row
                .map((i) => `<div class="cell"></div>`)
                .join("")}</div>`
    ).join("");
};

const BOARD_SIZE = 19;
const [BLACK, WHITE] = [1, 2];
const turnStr = ["empty", "black", "white"];
const repeat5 = repeat(5);
const isInBoard = ([x, y]) =>
    0 <= x && x < BOARD_SIZE && 0 <= y && y < BOARD_SIZE;
const index = (x, y) => y * BOARD_SIZE + x;

const board = document.querySelector(".board");
draw(board, createGrid(BOARD_SIZE - 1));

const points = document.querySelector(".points");
draw(points, createGrid(BOARD_SIZE));
const pointIndexList = [3, 9, 15].flatMap((x) =>
    [3, 9, 15].map((y) => index(x, y))
);
const point = `<div class="wrapper"><div class="point"></div></div>`;
const pointCells = points.querySelectorAll(".cell");
pointIndexList.forEach((index) => (pointCells[index].innerHTML = point));

const container = document.querySelector(".container");
draw(container, createGrid(BOARD_SIZE));

class UI {
    constructor() {
        this.info = document.createElement("div");
        this.info.classList.add("center", "hide", "info");
        container.appendChild(this.info);
    }

    win(turn) {
        this.info.classList.remove("hide", "black", "white");
        this.info.classList.add(turnStr[turn]);
        this.info.innerText = `${turn === BLACK ? "흑" : "백"} 승리`;
        setTimeout(() => this.info.classList.add("hide"), 3000);
    }
}

const ui = new UI();

class GameStatus {
    constructor(container) {
        this.grid = createGrid(BOARD_SIZE);
        this.turn = BLACK;
        this.cells = container.querySelectorAll(".cell");
        this.logs = [];
    }

    switchTurn() {
        this.turn = this.turn === BLACK ? WHITE : BLACK;
    }

    get turnClass() {
        return turnStr[this.turn];
    }

    point(x, y) {
        if (this.grid[y][x]) return;

        this.grid[y][x] = this.turn;
        const unit = `<div class="unit ${this.turnClass}"></div>`;
        this.cells[y * BOARD_SIZE + x].innerHTML = unit;

        this.logs.push([x, y]);

        this.checkWin();
        this.switchTurn();
    }

    checkWin() {
        const turnPositions = this.grid.flatMap((row, y) =>
            row.reduce(
                (acc, turn, x) => (turn === this.turn ? [...acc, [x, y]] : acc),
                []
            )
        );

        for (const [x, y] of turnPositions) {
            const right = zip(range(x, x + 4), repeat5(y));
            const left = zip(range(x, x - 4), repeat5(y));
            const top = zip(repeat5(x), range(y, y + 4));
            const bottom = zip(repeat5(x), range(y, y - 4));
            const bottomLeft = zip(range(x, x + 4), range(y, y + 4));
            const bottomRight = zip(range(x, x - 4), range(y, y + 4));
            const topRight = zip(range(x, x + 4), range(y, y - 4));
            const topLeft = zip(range(x, x - 4), range(y, y - 4));

            const toTurn = ([x, y]) => this.grid[y][x];
            const isSameTurn = (turn) => turn === this.turn;

            const fiveInRow = !![
                right,
                left,
                top,
                bottom,
                topRight,
                topLeft,
                bottomRight,
                bottomLeft,
            ]
                .filter((poss) => poss.every(isInBoard))
                .filter((poss) => poss.map(toTurn).every(isSameTurn)).length;

            if (fiveInRow) {
                return ui.win(this.turn);
            }
        }
    }

    undo() {
        if (!this.logs.length) return;

        const [x, y] = this.logs.pop();
        this.grid[y][x] = 0;
        this.cells[y * BOARD_SIZE + x].innerHTML = "";
        this.switchTurn();
    }
}

const gameStatus = new GameStatus(container);

[...document.querySelectorAll(".container .cell")].forEach(function (
    elem,
    idx
) {
    elem.addEventListener("mouseenter", function (e) {
        if (!this.innerHTML)
            this.innerHTML = `<div class="unit ${gameStatus.turnClass} shadow"></div>`;
    });

    elem.addEventListener("mouseleave", function (e) {
        if (this.innerHTML.includes("shadow")) this.innerHTML = "";
    });

    elem.addEventListener("click", function (e) {
        const y = ~~(idx / BOARD_SIZE);
        const x = idx % BOARD_SIZE;
        gameStatus.point(x, y);
    });
});

document.querySelector("#undo")
    .addEventListener("click", () => gameStatus.undo());
