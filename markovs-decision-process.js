// define variables

let rows, columns, board = [];
let deliveryReward, powerCost, repairCost, discount;
let contrast, directions, values = [];
let startNode, goalNode, rivals = [];
let isMouseDown, mode, gradientActive = false, lastCompressedValues = [];

document.getElementById("rows").addEventListener("input", update);
document.getElementById("columns").addEventListener("input", update);


function setup() {
    update();
    board[1][1] = "start";
    startNode = [1,1]; // we put a start node
    board[rows - 2][columns - 2] = "goal";
    goalNode = [rows - 2][columns - 2]; // we put an end node
    createBoard(); // we generate the board
    let gradient = document.getElementById("toggleGradient");
    gradient.disabled = true;
}

window.onload = setup;

function update() {
    rows = parseInt(document.getElementById("rows").value);
    columns = parseInt(document.getElementById("columns").value);
    deliveryReward = parseFloat(document.getElementById("deliveryReward").value);
    powerCost = parseFloat(document.getElementById("powerCost").value);
    repairCost = parseFloat(document.getElementById("repairCost").value);
    discount = parseFloat(document.getElementById("discount").value);
    contrast = parseInt(document.getElementById("contrast").value);
    directions = parseInt(document.querySelector('input[name="directionMode"]:checked').value);
    createBoard();
}

function setupEvents(cell) {
    cell.addEventListener("mousedown", (event) => {
        isMouseDown = true;
        draw(event); // paint start/end/obstacle
    });
    cell.addEventListener("mouseup", () => {
        isMouseDown = false;
    })
    cell.addEventListener("mouseover", (event) => {
        if (isMouseDown)draw(event);
    })
}

function indexElement(arr, target) { // used for searching for start/goal nodes
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] === target)
                return {i, j}; // return the index we are searching for as an object
        }
    }
    return null; // if we can't find the node that matches
}

function createBoard() {

    const gridContainer = document.querySelector(".grid-container");
    gridContainer.replaceChildren();
    const oldBoard = board;
    board = new Array(rows).fill(0).map(() => new Array(columns).fill("empty"));

    for (let i = 0; i < rows; i++) {
        const row = document.createElement("div");
        row.classList.add("row"); // creating a div with class "row"
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;

            setupEvents(cell);

            if (oldBoard[i] && oldBoard[i][j]) {
                cell.classList.add(oldBoard[i][j]);
                board[i][j] = oldBoard[i][j]; // we preserve the existing cell color if it is available
            }
            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

function selectMode(newMode) { // used mainly to change UI, to see which mode is active by darkening the button
    mode = newMode; // set the active mode from the html
    const drawModeButtons = document.querySelectorAll(".button.draw-mode"); // grabs all the buttons with these classes

    drawModeButtons.forEach((drawModeButton) => {
        if (drawModeButton.value === mode) drawModeButton.classList.add("active"); // adds the active class used for coloring if selected
        else
            drawModeButton.classList.remove("active"); // removes the active class
    });
}

function draw(event) {

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (mode === "obstacle") {
        if (cell.classList.contains("obstacle")) {
            cell.classList.remove("obstacle");
            board[row][col] = "empty";
        }
        else {
            cell.classList.add("obstacle");
            board[row][col] = "obstacle";
        }
    } else if (mode === "startNode") {
        let index = indexElement(board, "start");
        clearDuplicates(index);
        cell.classList.add("start");
        board[row][col] = "start";
    } else if (mode === "goalNode") {
        let index = indexElement(board, "goal");
        clearDuplicates(index);
        cell.classList.add("goal");
        board[row][col] = "goal";
    }

}

function clearDuplicates(index) {
    if (index) {
        const selector = `.cell[data-row="${index["i"]}"][data-col="${index["j"]}"]`;
        const oldCell = document.querySelector(selector);
        oldCell.className = "cell";
        board[index["i"]][index["j"]] = "empty";
    }
}


function togglePath() {

    update();
    toggleButtons(); // buttons are being turned off so that it doesn't regenerate at every swap of values if path is generated

    const generatedPath = document.getElementById("togglePath");

    generatedPath.classList.toggle("active");

    const path = document.querySelectorAll(".cell.path"); // select all cells with the .path class
    path.forEach((cell) => {
        cell.classList.remove("path"); // remove the .path class from each cell
    });

    if (generatedPath.classList.contains("active")) {
        planPath();
    } else {
        if (gradientActive) toggleGradient(); // disabling the gradient if it's on and we toggled the path off
    }
}

function planPath() {

    let policies = Array.from({ length: rows }, () => Array(columns).fill(0)); // initialize each policy cell to no moves yet
    values   = Array.from({ length: rows }, () => Array(columns).fill(0)); // initialize each value cell to starting utility

    computePolicies(values, policies);
    showPath(policies);
}

function computePolicies(values, policies) {

    let prev = copyValues(values); // getting a copy to track changes from convergence
    mapHazardPositions();
    values[goalNode[0]][goalNode[1]] = deliveryReward; // set the utility of the goal cell to the delivery reward

    for (let r of rivals) {
        let i = r[0], j = r[1];
        values[i][j] = -repairCost; // set the utility of each obstacle to the negative repair cost
    }

    while (true) { // loop until the value function converges (values stop changing significantly)
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                let currPosn = [i, j]; // possible error here
                if ((currPosn[0] !== goalNode[0] || currPosn[1] !== goalNode[1]) && !rivals.some((pos) => currPosn[0] === pos[0] && currPosn[1] === pos[1])) {
                    calculateNextMoves(currPosn, values, policies); // calculate the best move, and update utility for cell
                }
            }
        }
        if (converges(prev, values)) {
            break; // stop looping and return if board converges
        } else {
            prev = copyValues(values); // continue looping and keep track of previous values nxn matrix
        }
    }
    return values[startNode[0]][startNode[1]]; // returns utility values at the start position
}


function converges(prev, curr, converge_factor = 0.01) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (Math.abs(prev[i][j] - curr[i][j]) > converge_factor) {
                return false; // if the difference is larger than the convergence threshold, matrices have not converged
            }
        }
    }
    return true; // if all the differences are within the threshold, they converged
}

function calculateNextMoves(currPosn, values, policies) {

    // assume all neighboring positions are in range
    let s_range = true;
    let w_range = true;
    let n_range = true;
    let e_range = true;

    // checking if moving would go out of bounds

    if (currPosn[0] + 1 > rows - 1) s_range = false;
    if (currPosn[1] - 1 < 0) w_range = false;
    if (currPosn[0] - 1 < 0) n_range = false;
    if (currPosn[1] + 1 > columns - 1) e_range = false;

    let s_posn;
    let w_posn;
    let n_posn;
    let e_posn;
    let sw_posn;
    let se_posn;
    let nw_posn;
    let ne_posn;

    // determining actual neighboring positions, if out of bounds, stay in place

    if (s_range) s_posn = [currPosn[0] + 1, currPosn[1]];
    else s_posn = currPosn;

    if (w_range) w_posn = [currPosn[0], currPosn[1] - 1];
    else w_posn = currPosn;

    if (n_range) n_posn = [currPosn[0] - 1, currPosn[1]];
    else n_posn = currPosn;

    if (e_range) e_posn = [currPosn[0], currPosn[1] + 1];
    else e_posn = currPosn;

    if (s_range && w_range) sw_posn = [currPosn[0] + 1, currPosn[1] - 1];
    else sw_posn = currPosn;

    if (s_range && e_range) se_posn = [currPosn[0] + 1, currPosn[1] + 1];
    else se_posn = currPosn;

    if (n_range && w_range) nw_posn = [currPosn[0] - 1, currPosn[1] - 1];
    else nw_posn = currPosn;

    if (n_range && e_range) ne_posn = [currPosn[0] - 1, currPosn[1] + 1];
    else ne_posn = currPosn;

    // calculate the utility at all neighboring positions
    // direction_probability * (-1 * powerCost + (discount * values[next[y]][next[x]]))

    let s =
        0.7 * (-1 * powerCost + discount * values[s_posn[0]][s_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[w_posn[0]][w_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[e_posn[0]][e_posn[1]]);

    let w =
        0.7 * (-1 * powerCost + discount * values[w_posn[0]][w_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[n_posn[0]][n_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[s_posn[0]][s_posn[1]]);

    let n =
        0.7 * (-1 * powerCost + discount * values[n_posn[0]][n_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[w_posn[0]][w_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[e_posn[0]][e_posn[1]]);

    let e =
        0.7 * (-1 * powerCost + discount * values[e_posn[0]][e_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[n_posn[0]][n_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[s_posn[0]][s_posn[1]]);

    // diagonal directions

    let sw =
        0.7 * (-1 * powerCost + discount * values[sw_posn[0]][sw_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[se_posn[0]][se_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[nw_posn[0]][nw_posn[1]]);

    let se =
        0.7 * (-1 * powerCost + discount * values[se_posn[0]][se_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[sw_posn[0]][sw_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[ne_posn[0]][ne_posn[1]]);

    let nw =
        0.7 * (-1 * powerCost + discount * values[nw_posn[0]][nw_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[sw_posn[0]][sw_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[ne_posn[0]][ne_posn[1]]);

    let ne =
        0.7 * (-1 * powerCost + discount * values[ne_posn[0]][ne_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[nw_posn[0]][nw_posn[1]]) +
        0.15 * (-1 * powerCost + discount * values[se_posn[0]][se_posn[1]]);

    if (directions === 4) {
        let moves = [e, n, w, s]; // add all possible 4 moves to a list
        let max_val = Math.max(...moves);
        let max_move = moves.indexOf(max_val); // find the direction with the maximum utility

        // update value & policies matrices
        values[currPosn[0]][currPosn[1]] = max_val; // assign max utility to current cell
        policies[currPosn[0]][currPosn[1]] = max_move + 1; // store best move
    }
    else if (directions === 8) {
        let moves = [e, n, w, s, sw, se, nw, ne];
        let max_val = Math.max(...moves);
        let max_move = moves.indexOf(max_val);

        // update value & policies matrices
        values[currPosn[0]][currPosn[1]] = max_val; // assign max utility to current cell
        policies[currPosn[0]][currPosn[1]] = max_move + 1; // store best move
    }
}

function mapHazardPositions() {
    rivals = [];
    // startNode = null; goalNode = null;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (board[i][j] === "start") {
                startNode = [i, j]; // store the start position
            }
            if (board[i][j] === "goal") {
                goalNode = [i, j]; // store the goal position
            }
            if (board[i][j] === "obstacle") {
                rivals.push([i, j]); // add an obstacle to the array
            }
        }
    }
}

function toggleButtons() {
    const ids = ["powerCost", "repairCost", "deliveryReward", "discount", "contrast", "wall", "start_btn", "goal_btn", "four-directions", "eight-directions", "toggleGradient"];
    ids.forEach(id => { // disabling/enabling buttons depending on if 
        const element = document.getElementById(id);
        if (element) element.disabled = !element.disabled;
        if (element.disabled && element.classList.contains("active"))
            element.classList.remove("active");
    }    );
    selectMode(""); // un-selecting the last selected mode after generating a path
}


function showPath(policies) {

    const gridContainer = document.querySelector(".grid-container");

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (board[i][j] === "path") {
                board[i][j] = "empty";  // clear all existing paths
                const oldCell = gridContainer.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                if (oldCell) oldCell.classList.remove("path");
            }
        }
    }

    let currRow = startNode[0], currCol = startNode[1]; // start tracing path
    let steps = 0;

    while (policies[currRow] && policies[currRow][currCol] !== 0 && steps < rows*columns) {
        steps++; // safety measure to stop & not go overboard
        switch (policies[currRow][currCol]) {  // move to the next cell based on the policy
            case 1: // move right
                currCol++;
                break;
            case 2: // move up
                currRow--;
                break;
            case 3: // move left
                currCol--;
                break;
            case 4: // move down
                currRow++;
                break;
            case 5: // move south-west
                currRow++; currCol--;
                break;
            case 6: // move south-east
                currRow++; currCol++;
                break;
            case 7: // move north-west
                currRow--; currCol--;
                break;
            case 8: // move north-east
                currRow--; currCol++;
                break;
            default: // invalid policy
                return null;
        }
        const selector = `.cell[data-row="${currRow}"][data-col="${currCol}"]`;
        const cell = gridContainer.querySelector(selector);

        if (cell && !cell.classList.contains("obstacle") && !cell.classList.contains("start") && !cell.classList.contains("goal")) {
            board[currRow][currCol] = "path";
            cell.classList.add("path"); // add the "path" class to the current cell
        }
    }
}

function toggleGrid() {
    const toggleButton = document.getElementById("toggleGrid");
    toggleButton.classList.toggle("active"); // button appearance on toggle

    const gridContainer = document.querySelector(".grid-container");
    gridContainer.classList.toggle("no-border"); // grid visibility
}

function compressMatrixTo255(matrix) { // linear compression algorithm for turning the negative values instead to values 0-255
    const flat = matrix.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    if (min === max) return matrix.map(row => row.map(() => 128)); // 128 cause it looked better than 255, 255 was too light

    return matrix.map(row =>
        row.map(value => {
            // normalize 0–1
            let norm = (value - min) / (max - min);
            // apply contrast custom, so it can work nice with big boards and small ones :D
            norm = Math.pow(norm, contrast);
            // scale to 0–255
            return Math.round(norm * 255);
        })
    );
}

function toggleGradient() {

    const btn_togglePath = document.getElementById("togglePath");
    if (!btn_togglePath.classList.contains("active")) return;

    const toggledGradient = document.getElementById("toggleGradient");
    const gridContainer = document.querySelector(".grid-container");

    toggledGradient.classList.toggle("active"); // toggle the active class for the button

    if (!values || values.length === 0) return;

    // compress values only when turning gradient on
    if (!gradientActive) lastCompressedValues = compressMatrixTo255(values);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {

            const cell = gridContainer.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
            if (!cell) continue;

            if (!cell.dataset.originalBg) { // store original background
                cell.dataset.originalBg = window.getComputedStyle(cell).backgroundColor;
            }

            const preservedClasses = new Set(["start", "goal", "obstacle", "path"]);

            if (!gradientActive) {
                // apply gradient only to empty cells
                if (![...preservedClasses].some(cls => cell.classList.contains(cls))) {
                    const value = lastCompressedValues[i][j];
                    cell.style.backgroundColor = `rgb(${value}, ${value}, ${value})`;
                }
            } else {
                // restore original background
                if (![...preservedClasses].some(cls => cell.classList.contains(cls))) {
                    cell.style.backgroundColor = ""; // let other functions take control
                }
            }
        }
    }
    gradientActive = !gradientActive;
}

function clearBoard() {

    const generatedPath = document.getElementById("togglePath");
    if (generatedPath.classList.contains("active")) togglePath(); // if path is toggled when clearing, we turn it off
    board = new Array(rows).fill(0).map(() => new Array(columns).fill("empty")); // regenerating the map
    rivals = []; // resetting rivals array
    setup();   // update UI
}

function copyValues(values){
    let new_values = [];
    for (let i = 0; i < rows; i++) {
        new_values[i] = [];
        for (let j = 0; j < columns; j++) {
            new_values[i][j] = values[i][j];
        }
    }
    return new_values; // return the newly created copy of the matrix
}