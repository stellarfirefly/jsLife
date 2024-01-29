
class Life {
    #canvas;            // canvas object, passed to constructor
    #ctx;               // context, set to 2D
    #resX = 600;        // pixel resolution of the canvas
    #resY = 600;
    #gridX;             // grid resolution of the playfield
    #gridY;
    #cellSize;          // size of each cell (square)
    #grid;              // the playfield itself

    showGrid = false;   // draw grid outlines? (not recommended for large grids, slows down)
    animFPS = 10;       // how quickly to animate the grid, in frames per second
    timeSync;           // time of last frame render
    frameTime = 1000 / this.animFPS;      // actual frame render time in milliseconds
    frameTimeAvg = 10;  // average frame time calculation over this many frames
    isPaused = false;   // allows pausing of the simulation

    cellState = Object.freeze({     // enumeration of cell states
        DEAD:   false,
        ALIVE:  true,
    });

    gridPattern = Object.freeze({   // enumeration of initial patterns
        CLEAR:  1,
        RANDOM:   2,
    });

    constructor(canvasElement, gx, gy){
        this.#canvas = canvasElement;
        this.#canvas.width = this.#resX;
        this.#canvas.height = this.#resY;
        this.#ctx = canvasElement.getContext("2d");

        this.setGridSize(gx, gy);

        this.timeSync = performance.now();      // initialize animation timer
        window.requestAnimationFrame(() => this.update());
    }

    initGrid(style = this.gridPattern.CLEAR){
        switch(style){
            case this.gridPattern.CLEAR:
                this.#grid = new Array(this.#gridX).fill(null)      // columns, must fill with null to make iterable
                    .map(() => new Array(this.#gridY).fill(this.cellState.DEAD));   // rows, initialize to dead
                break;
            case this.gridPattern.RANDOM:
                this.#grid = new Array(this.#gridX).fill(null)      // columns, must fill with null to make iterable
                    .map(() => new Array(this.#gridY).fill(null).map(() => Math.floor(Math.random()*1.5)));
                break;
        }
    }

    update(){
        if(this.isPaused === false){
            const pNow = performance.now();
            const dt = pNow - this.timeSync;
            if(dt * this.animFPS / 1000.0 >= 1.0){  // limit framerate to not hog CPU
                const ft = this.frameTime;
                const fta = this.frameTimeAvg;
                this.frameTime = (ft * (fta - 1) + dt) / fta;   // store last delta time
                this.timeSync = pNow;               // update animation timer for next frame
                this.calcNextGen();
                this.drawGrid();
            }
        }
        window.requestAnimationFrame(() => this.update());
    }

    drawGrid(){
        this.#ctx.beginPath();
        this.#ctx.rect(0, 0, this.#resX, this.#resY);
        this.#ctx.fillStyle = 'white';
        this.#ctx.fill();
        for(let x=0; x<this.#gridX; ++x){
            for(let y=0; y<this.#gridY; ++y){
                    // define and draw the grid square using the canvas context
                this.#ctx.beginPath();
                this.#ctx.rect(x*this.#cellSize, y*this.#cellSize, this.#cellSize, this.#cellSize);
                this.#ctx.fillStyle = this.#grid[x][y] ? 'white' : 'black';
                this.#ctx.fill();
                if(this.showGrid){
                    // also draw the grid outlines
                    this.#ctx.stroke();
                }
            }
        }
    }

    setGridSize(gx, gy){
        const origPause = this.isPaused;    // save original pause state
        this.isPaused = true;               // don't allow simulation while changing grid parameters
        this.#gridX = gx;
        this.#gridY = gy;
            // ensure the playfield fits into the canvas
        this.#cellSize = Math.min(Math.floor(this.#resX / this.#gridX), Math.floor(this.#resY / this.#gridY));
        this.initGrid();
        this.drawGrid();
        this.isPaused = origPause;          // restore pause state
    }

    setFPSCap(cap){
        this.animFPS = cap;
    }

    // set a single cell to ALIVE
    setAlive(x, y){
        this.setCell(x, y, this.cellState.ALIVE);
    }

    // set a single cell to DEAD
    setDead(x, y){
        this.setCell(x, y, this.cellState.DEAD);
    }

    // set a single cell's state by canvas coordinate
    setCell(x, y, state){
        const gx = Math.floor(x / this.#cellSize);
        const gy = Math.floor(y / this.#cellSize);
        this.#grid[gx][gy] = state;
    }

    // count the number of neighbors
    numNeighbors(x, y){
        let n = -this.#grid[x][y];      // remove center cell itself
        for(let i=-1; i<2; ++i){
            for(let j=-1; j<2; ++j){
                let cx = x+i;
                let cy = y+j;
                if(cx>=0 && cy>=0 && cx<this.#gridX && cy<this.#gridY){     // check if outside grid
                    n += this.#grid[cx][cy] ? 1 : 0;
                }
            }
        }
        return n;
    }

    calcNextGen(){
        const newGen = this.#grid.map(arr => [...arr]);     // duplicate array using spread operator
        for(let x=0; x<this.#gridX; ++x){
            for(let y=0; y<this.#gridY; ++y){
                const adjacent = this.numNeighbors(x, y);
                if(this.#grid[x][y] == this.cellState.ALIVE){       // current cell alive
                    if(adjacent<2 || adjacent>3){
                        newGen[x][y] = this.cellState.DEAD;
                    }
                }else{                      // current cell dead
                    if(adjacent==3){
                        newGen[x][y] = this.cellState.ALIVE;
                    }
                }
            }
        }
        this.#grid = newGen;
    }
}

//----
//  Global configuration and working variables.
//
lifeCfg = {
    updateUI:       1.0,        // seconds between updating UI display data (not the playfield)
    updateUISync:   undefined,
    defaultGridX:   50,
    defaultGridY:   50,
    drawPrevPoint:  undefined,  // previous drawing point, if any
    erasePrevPoint: undefined,  // previous erasure point, if any
}

function initialize(){
        // the Life canvas and object
    let canvasLife = document.getElementById("canvasLife");
    let life = new Life(canvasLife, lifeCfg.defaultGridX, lifeCfg.defaultGridY);
        // click and mousemove in canvas
    canvasLife.addEventListener("mousedown", function(e){ drawInCanvas(e, life); });
    canvasLife.addEventListener("mousemove", function(e){ drawInCanvas(e, life); });
    canvasLife.addEventListener("contextmenu", (e) => {e.preventDefault();});     // disable the context menu
        // the grid size selector
    let gridSelector = document.getElementById("gridSelector");
    gridSelector.addEventListener("input", function(){ changeGrid(life); });
        // the FPS cap selector
    let fpsCap = document.getElementById("fpsCap");
    fpsCap.addEventListener("input", function(){ changeFPSCap(life); });
        // button to pause the simulation
    let pauseSim = document.getElementById("pauseSim");
    pauseSim.addEventListener("click", function(){ pauseSimulation(pauseSim, life); });
        // button to clear the playgrid
    let clearGrid = document.getElementById("clearGrid");
    clearGrid.addEventListener("click", function(){ clearPlayfield(life); });
        // button to randomize the playgrid pattern
    let randPattern = document.getElementById("randPattern");
    randPattern.addEventListener("click", function(){ randomizePattern(life); });
        // start animations to continuously update UI data
    lifeCfg.updateUISync = performance.now();
    window.requestAnimationFrame(() => update(life));
}

function drawInCanvas(e, life){
    if(e.buttons == 1){      // mouse-1 pressed
        let p = lifeCfg.drawPrevPoint;
        if(p){
            const toSet = bresenham(p[0], p[1], e.offsetX, e.offsetY);
            for(pt of toSet){
                life.setAlive(pt[0], pt[1]);
            }
        }
        life.setAlive(e.offsetX, e.offsetY);
        life.drawGrid();
        lifeCfg.drawPrevPoint = [e.offsetX, e.offsetY]; // no previous draw point, set it
    }else{
        lifeCfg.drawPrevPoint = undefined;      // mouse-1 not pressed, no previous draw point
    }

    if(e.buttons == 2){     // mouse-2 pressed
        let p = lifeCfg.erasePrevPoint;
        if(p){
            const toClear = bresenham(p[0], p[1], e.offsetX, e.offsetY);
            for(pt of toClear){
                life.setDead(pt[0], pt[1]);
            }
        }
        life.setDead(e.offsetX, e.offsetY);
        life.drawGrid();
        lifeCfg.erasePrevPoint = [e.offsetX, e.offsetY];
    }else{
        lifeCfg.erasePrevPoint = undefined;
    }
}

function changeGrid(life){              // control to change the grid size
    const gridSelector = document.getElementById("gridSelector");
    const gridDim = parseInt(gridSelector.value);
    life.setGridSize(gridDim, gridDim);
}

function changeFPSCap(life){            // control to change the max FPS
    const fpsCap = document.getElementById("fpsCap");
    const newCap = parseInt(fpsCap.value);
    life.setFPSCap(newCap);
}

function pauseSimulation(el, life){         // toggle the pause state
    if(life.isPaused){
        life.isPaused = false;
        el.textContent = "Pause";
    }else{
        life.isPaused = true;
        el.textContent = "Play";
    }
}

function clearPlayfield(life){               // clear the playfield
    life.initGrid(life.gridPattern.CLEAR);
    life.drawGrid();
}

function randomizePattern(life){        // set cells randomly
    life.initGrid(life.gridPattern.RANDOM);
    life.drawGrid();
}

function update(life){
    const pNow = performance.now();
    const dt = pNow - lifeCfg.updateUISync;
    if(dt/1000 >= lifeCfg.updateUI){
        lifeCfg.updateUISync = pNow;
        if(life.frameTime){     // update only if the frame time has been calculated
            let fpsElement = document.getElementById("fpsDisplay");
            let fps = 1000.0 / life.frameTime;      // frameTime is in milliseconds but FPS is in seconds
            fpsElement.textContent = fps.toFixed(1);
        }
    }
    window.requestAnimationFrame(() => update(life));
}

// Bresenham's line algorithm, plots x0,y0 to x1,y1, returns array of array2's
function bresenham(x0, y0, x1, y1){
    let points = [];

    let dx =  Math.abs(x1-x0);
    let sx = x0<x1 ? 1 : -1;
    let dy = -Math.abs(y1-y0);
    let sy = y0<y1 ? 1 : -1;
    let err = dx+dy;    // error trackers for steps
    let e2;

    while(true){        // version of algorithm with inifinite loop and break
        points.push([x0, y0]);
        if(x0 == x1 && y0 == y1){
            break;
        }
        e2 = 2*err;
        if(e2 >= dy){      // x-step
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx){      // y-step
            err += dx;
            y0 += sy;
        }
    }
    return points;
}

initialize();
