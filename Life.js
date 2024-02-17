class Life {
    #canvas;            // canvas object, passed to constructor
    #ctx;               // context, set to 2D
    #resX;              // pixel resolution of the canvas
    #resY;
    #controlZone = 120; // size of controls below canvas
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
        this.#canvas = document.getElementById(canvasElement);
        this.#ctx = this.#canvas.getContext("2d");
        this.setGridSize(gx, gy);
        this.resizeCanvas();
        this.calcCellSize();

        this.timeSync = performance.now();      // initialize animation timer

            // Note that the following code does NOT work here:
//        window.requestAnimationFrame(function(){ this.update(); });
            // ...because on the next frame call, the function no longer knows what "this" is.
            // We can maintain the reference by calling .bind() to explicitly bind "this" on the
            // animation frame call, making sure it is always bound to this particular "this":
//        window.requestAnimationFrame( this.update.bind(this) );
            // But the arrow function expression seems to implicitly also bind "this" and thus it
            // also works, and is more compact. We'll use it for animation frame calls within
            // classes from now on.
        window.requestAnimationFrame(() => this.update());
    }

    setGridSize(gx, gy){
        const origPause = this.isPaused;    // save original pause state
        this.isPaused = true;               // don't allow simulation while changing grid parameters
            // ensure the playfield fits into the canvas
        this.#gridX = gx;
        this.#gridY = gy;
        this.initGrid();
        this.isPaused = origPause;          // restore pause state
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

    // resize the drawing canvas to fit into the current window
    resizeCanvas(){
        // some browsers seem to still enable the horizontal scroll bar even when the canvas
        // is set to the window's inner width, removing an extra 8 pixels seems to fix this
    this.#resX = window.innerWidth - 8;
    this.#resY = window.innerHeight - this.#controlZone;
    this.#canvas.width = this.#resX;
    this.#canvas.height = this.#resY;
    }

    // calcualte cell size based on grid size and canvas size
    calcCellSize(){
        this.#cellSize = Math.min(Math.floor(this.#resX / this.#gridX), Math.floor(this.#resY / this.#gridY));
    }

    // animation update function, throttled by animFPS
    update(){
        if(this.isPaused === false){
            const pNow = performance.now();
            const dt = pNow - this.timeSync;
            if(dt * this.animFPS / 1000.0 >= 1.0){  // limit framerate to not hog CPU
                const ft = this.frameTime;
                const fta = this.frameTimeAvg;
                this.frameTime = (ft * (fta - 1) + dt) / fta;   // store last delta time
                this.timeSync = pNow;               // update animation timer for next frame
                this.stepSimulation();
            }
        }
        window.requestAnimationFrame(() => this.update());
    }

    // perform a single step of the simulation
    stepSimulation(){
        this.calcNextGen();
        this.drawGrid();
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
            // canvas events can still trigger outside of the draw area as long as it is
            // still in the canvas area, so we need to make sure the cell is still in bounds
        if(gx >= 0 && gy >= 0 && gx < this.#gridX && gy < this.#gridY){
            this.#grid[gx][gy] = state;
        }
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

export { Life };
