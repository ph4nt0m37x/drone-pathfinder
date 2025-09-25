// declaring variables used

const CELL_VALUES = {
    OBSTACLE: "obstacle",
    EMPTY: "empty",
    START: "start",
    END: "end",
    PATH: "path",
    GRADIENT: "gradient",
}

let rows; // number of rows
let columns; // number of columns
let deliveryReward; //
let powerCost;
let repairCost;
let discount;
let contrast;
let globalValues = [];

let grid = []; // the board
let start; // starting position
let goal; // goal position
let rivals = []; // obstacles are in this array

let selectedMode = ""; // current drawing mode
let isMouseDown = false; // tracking if the mouse is pressed
let gradientActive = false;
let lastCompressedValues = []; // store compressed values for toggle


// event listeners, so that whenever the input changes, we update the existing values, and re-generate the grid
document.getElementById("rows").addEventListener("input", updateValues);
document.getElementById("cols").addEventListener("input", updateValues);
document.getElementById("deliveryReward").addEventListener("input", updateValues);
document.getElementById("powerCost").addEventListener("input", updateValues);
document.getElementById("repairCost").addEventListener("input", updateValues);
document.getElementById("discount").addEventListener("input", updateValues);
document.getElementById("contrast").addEventListener("input", updateValues);
document.addEventListener("mouseup", () => {isMouseDown = false; }); // when the mouse is released, we reset the isMouseDown bool to false


// initial grid
window.onload = function () {

    updateValues(); // we update with the existing placeholder values
    grid[1][1] = CELL_VALUES.START; // we put a start node
    grid[rows - 2][columns - 2] = CELL_VALUES.END; // we put an end node
    generateGrid(); // we generate the grid
};

// getting the values from the html
function updateValues() {

    rows = parseInt(document.getElementById("rows").value);
    columns = parseInt(document.getElementById("cols").value);
    deliveryReward = parseFloat(document.getElementById("deliveryReward").value);
    powerCost = parseFloat(document.getElementById("powerCost").value);
    repairCost = parseFloat(document.getElementById("repairCost").value);
    discount = parseFloat(document.getElementById("discount").value);
    contrast = parseInt(document.getElementById("contrast").value);
    generateGrid();
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

function generateGrid() { // generates the initial grid

    const gridContainer = document.querySelector(".grid-container");
    const oldGrid = grid; // we take the old grid, so we can paint cells on it
    gridContainer.innerHTML = ""; // we clear the old board

    grid = new Array(rows).fill(0).map(() => new Array(columns).fill(false)); // change false with some other state of choosing

    for (let i = 0; i < rows; i++) {

        const row = document.createElement("div");
        row.classList.add("row"); // creating a div with class "row"

        for (let j = 0; j < columns; j++) {

            const cell = document.createElement("div");
            cell.classList.add("cell"); // creating a cell, in that row, in that column

            cell.dataset.row = i; // set row index as data attribute
            cell.dataset.col = j; // set column index as data attribute

            cell.addEventListener("mousedown", (event) => {
                isMouseDown = true;
                paintCell(event); // we use this to put down a start node, end node and obstacles.
            });

            cell.addEventListener("mouseover", (event) => {
                if (isMouseDown) {
                    paintCell(event); // this is so that it works with dragging.
                }
            });

            if (oldGrid[i] && oldGrid[i][j]) {
                cell.classList.add(oldGrid[i][j]);
                grid[i][j] = oldGrid[i][j]; // we preserve the existing cell color if it is available
            }
            row.appendChild(cell); // we add the column, that is, the "cell" to the row
        }
        gridContainer.appendChild(row); // we add the row to the grid-container
    }

    document.addEventListener("mouseup", () => {
        isMouseDown = false; // when the mouse is released, we reset the isMouseDown bool to false
    });

}

function selectMode(mode) { // used mainly to change UI, to see which mode is selected by darkening the button

    selectedMode = mode; // set the selected mode from the html
    const drawModeButtons = document.querySelectorAll(".button.draw-mode"); // grabs all the buttons with these classes

    if (selectedMode === CELL_VALUES.EMPTY){
        grid = [];
        rivals = [];
        start = null;
        goal = null;
        generateGrid();
        selectedMode = "";
    }

    drawModeButtons.forEach((drawModeButton) => {
        if (drawModeButton.value === selectedMode) {
            drawModeButton.classList.add("selected"); // adds the selected class used for coloring if selected
        } else
        {
            drawModeButton.classList.remove("selected"); // removes the selected class
        }
    });

}

function paintCell(event) { // function to paint the cells

    const cell = event.target; // cell that triggered it

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col); // find its location

    // toggle cell color based on the mode

    if (selectedMode === CELL_VALUES.OBSTACLE) {

        if (cell.classList.contains(CELL_VALUES.OBSTACLE)) {
            // if already an obstacle, remove it
            cell.classList = "cell";
            grid[row][col] = CELL_VALUES.EMPTY;
        } else {
            // otherwise, add obstacle
            cell.classList = "cell";
            cell.classList.add(CELL_VALUES.OBSTACLE);
            grid[row][col] = CELL_VALUES.OBSTACLE;
        }
    } else if (selectedMode === CELL_VALUES.GRADIENT) {

    }
    else if (selectedMode === CELL_VALUES.START) {

        let index = indexElement(grid, CELL_VALUES.START);

        clearDuplicated(index, CELL_VALUES.START);

        cell.classList = "cell";
        cell.classList.add(CELL_VALUES.START); // set new start node so the css can modify it
        grid[row][col] = CELL_VALUES.START; // update the grid model, so it knows the cell is a start node

    } else if (selectedMode === CELL_VALUES.END) {
        let index = indexElement(grid, CELL_VALUES.END);

        clearDuplicated(index, CELL_VALUES.END);

        cell.classList = "cell";
        cell.classList.add(CELL_VALUES.END); // set new goal node so the css can modify it
        grid[row][col] = CELL_VALUES.END; // update the grid model, so it knows the cell is a goal node

    }

}

function clearDuplicated(index, type) {
    if (index) {
        const selector = `.cell[data-row="${index["i"]}"][data-col="${index["j"]}"]`;
        const oldCell = document.querySelector(selector);
        oldCell.classList = "cell";
        grid[index["i"]][index["j"]] = null;
    }
}

function toggleGrid() {
    const gridContainer = document.querySelector(".grid-container");
    const toggleButton = document.getElementById("toggleGrid");

    // log the button to confirm it is being selected correctly
    console.log(toggleButton);

    // toggle the 'selected' class on the button
    toggleButton.classList.toggle("selected");

    // toggle the 'no-border' class on the grid container
    gridContainer.classList.toggle("no-border");
}

function togglePath() {
    const generatedPath = document.getElementById("togglePath");

    generatedPath.classList.toggle("selected"); // toggle the selected class for the button

    const pathCells = document.querySelectorAll(".cell.path"); // select all cells with the .path class
    pathCells.forEach((cell) => {
        cell.classList.remove("path"); // remove the .path class from each cell
    });

    if (generatedPath.classList.contains("selected")) {
        testDronePathPlanner();
    }

}

function copyValues(values) {
    let new_values = [];
    for (let i = 0; i < rows; i++) {
        new_values[i] = [];
        for (let j = 0; j < columns; j++) {
            new_values[i][j] = values[i][j];
        }
    }
    return new_values; // return the newly created copy of the matrix
}


// checks to see if the previous and current value boards converge by a factor of 0.1%
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

// calculates the next possible 4 moves and then sets values to the max of that move and policies to the direction of the max move
function calculateNextMoves(currPosn, values, policies) {

    // assume all neighboring positions are in range
    let s_range = true;
    let w_range = true;
    let n_range = true;
    let e_range = true;

    // checking if moving would go out of bounds

    if (currPosn[0] + 1 > rows - 1) {
        s_range = false;
    }
    if (currPosn[1] - 1 < 0) {
        w_range = false;
    }
    if (currPosn[0] - 1 < 0) {
        n_range = false;
    }
    if (currPosn[1] + 1 > columns - 1) {
        e_range = false;
    }
    let s_posn;
    let w_posn;
    let n_posn;
    let e_posn;

    // determining actual neighboring positions, if out of bounds, stay in place

    if (s_range) {
        s_posn = [currPosn[0] + 1, currPosn[1]];
    } else {
        s_posn = currPosn;
    }

    if (w_range) {
        w_posn = [currPosn[0], currPosn[1] - 1];
    } else {
        w_posn = currPosn;
    }

    if (n_range) {
        n_posn = [currPosn[0] - 1, currPosn[1]];
    } else {
        n_posn = currPosn;
    }

    if (e_range) {
        e_posn = [currPosn[0], currPosn[1] + 1];
    } else {
        e_posn = currPosn;
    }

    // calculate the utility at all neighboring positions
    // direction_probability * (-1 * powerCost + (discount * values[next[y]][next[x]]))

    // create southeast, southwest, northeast i northwest
    // the variables u make, put them in the moves list, make 2 move lists

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


    let moves = [e, n, w, s]; // add all possible 4 moves to a list
    let max_val = Math.max(...moves);
    let max_move = moves.indexOf(max_val); // find the direction with the maximum utility

    // update value & policies matrices
    values[currPosn[0]][currPosn[1]] = max_val; // assign max utility to current cell
    policies[currPosn[0]][currPosn[1]] = max_move + 1; // store best move
    console.log(values)
}

function printMatrix(matrix) {
    let maxLength = 8;
    // Print the matrix with formatted numbers
    for (let row of matrix) {
        let rowString = "";
        for (let val of row) {
            const formattedVal = val.toFixed(4).padStart(maxLength + 1);
            rowString += formattedVal + " ";
        }
        console.log(rowString);
    }
    console.log("\n");
}

function startGoalHazardPositions() {
    rivals = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (grid[i][j] === CELL_VALUES.START) {
                start = [i, j]; // store the start position
            }
            if (grid[i][j] === CELL_VALUES.END) {
                goal = [i, j]; // store the goal position
            }
            if (grid[i][j] === CELL_VALUES.OBSTACLE) {
                rivals.push([i, j]); // add an obstacle to the array
            }
        }
    }
}

function dronePathPlanner(policies, values) {

    let prev = copyValues(values); // getting a copy to track changes from convergence

    startGoalHazardPositions(); // find the start, goal, and hazard (obstacle) positions in the grid

    //values e the gradient
    //zemax max vrednost, gi delis site vrednosti so maksimalnata vrednost,
    //so formula mozes da napravis namesto od 0 do 1, od 0 do 255 da bide colors?
    //i red i green i blue da bidat site ist value, to get gray?
    //toa mozem u css da go menjam.

    values[goal[0]][goal[1]] = deliveryReward; // set the utility of the goal cell to the delivery reward

    for (let r of rivals) {
        values[r[0]][r[1]] = repairCost * -1; // set the utility of each obstacle to the negative repair cost
    }

    // loop until the value function converges (values stop changing significantly)
    while (true) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                let currPosn = [i, j];
                // Possible error here
                if ((currPosn[0] !== goal[0] || currPosn[1] !== goal[1]) && !rivals.some((pos) => currPosn[0] === pos[0] && currPosn[1] === pos[1])) {
                    calculateNextMoves(currPosn, values, policies); // calculate the best move, and update utility for cell
                }
            }
        }
        if (converges(prev, values)) {
            // stop looping and return if board converges
            break;
        } else {
            // continue looping and keep track of previous values nxn matrix
            prev = copyValues(values);

        }
    }
    return values[start[0]][start[1]]; // returns utility values at the start position
}

function testDronePathPlanner() {
    let policies = []; // best moves
    let values = []; // utilities

    globalValues = values;

    for (let i = 0; i < rows; i++) {
        policies[i] = [];
        values[i] = [];
        for (let j = 0; j < columns; j++) {
            policies[i][j] = 0; // initialize each policy cell to no moves yet
            values[i][j] = 0; // initialize each value cell to starting utility
        }
    }

    let utilityAtStart = dronePathPlanner(policies, values); // run the main path planning function


    printMatrix(compressMatrixTo255(values));
    printMatrix(policies);

    colorPath(policies); // mark path on grid
}

function colorPath(policies) {
    const gridContainer = document.querySelector(".grid-container"); // getting the grid with all the cells

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (grid[i][j] === CELL_VALUES.PATH) {
                grid[i][j] = CELL_VALUES.EMPTY;  // clear all existing paths
            }
        }
    }

    // start tracing path
    let currentRow = start[0];
    let currentCol = start[1];

    while (policies[currentRow][currentCol] !== 0) {
        // move to the next cell based on the policy
        switch (policies[currentRow][currentCol]) {
            case 1:
                currentCol++; // move right
                grid[currentRow][currentCol] = CELL_VALUES.PATH;
                break;
            case 2:
                currentRow--; // move up
                grid[currentRow][currentCol] = CELL_VALUES.PATH;
                break;
            case 3:
                currentCol--; // move left
                grid[currentRow][currentCol] = CELL_VALUES.PATH;
                break;
            case 4:
                currentRow++; // move down
                grid[currentRow][currentCol] = CELL_VALUES.PATH;
                break;
            default:
                // invalid policy
                return null;
        }
        const selector = `.cell[data-row="${currentRow}"][data-col="${currentCol}"]`;
        const cell = gridContainer.querySelector(selector);
        if (cell) {
            cell.classList.add("path"); // add the "path" class to the current cell
        }
    }

    grid[currentRow][currentCol] = CELL_VALUES.END; // make sure the last cell is marked as the goal
}

function compressMatrixTo255(matrix) { // linear compression algorithm for turning the negative values instead to values 0-255
    const flat = matrix.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    if (min === max) return matrix.map(row => row.map(() => 128));

    return matrix.map(row =>
        row.map(value => {
            // normalize 0–1
            let norm = (value - min) / (max - min);
            // apply contrast custom, so it can work nice with big grids and small ones :D
            norm = Math.pow(norm, contrast);
            // scale to 0–255
            return Math.round(norm * 255);
        })
    );
}

function toggleGradient() { // gave up explaining this

    const toggledGradient = document.getElementById("toggleGradient");
    const gridContainer = document.querySelector(".grid-container");

    toggledGradient.classList.toggle("selected"); // toggle the selected class for the button

    if (!globalValues || globalValues.length === 0) return;

    // compress globalValues only when turning gradient on
    if (!gradientActive) {
        lastCompressedValues = compressMatrixTo255(globalValues);
    }

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const cell = gridContainer.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
            if (!cell) continue;

            // store original background if not already stored
            if (!cell.dataset.originalBg) {
                cell.dataset.originalBg = window.getComputedStyle(cell).backgroundColor;
            }

            if (!gradientActive) {
                // apply gradient only to empty cells
                if (!cell.classList.contains("start") &&
                    !cell.classList.contains("end") &&
                    !cell.classList.contains("obstacle") &&
                    !cell.classList.contains("path")) {
                    const value = lastCompressedValues[i][j];
                    cell.style.backgroundColor = `rgb(${value}, ${value}, ${value})`;
                }
            } else {
                // restore original background
                if (!cell.classList.contains("start") &&
                    !cell.classList.contains("end") &&
                    !cell.classList.contains("obstacle") &&
                    !cell.classList.contains("path")) {
                    cell.style.backgroundColor = ""; // let other functions take control
                }
            }
        }
    }
    gradientActive = !gradientActive;
}
