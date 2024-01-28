
class Life {
    #canvas;            // canvas object, passed to constructor
    #ctx;               // context, set to 2D
    #resX = 800;        // pixel resolution of the canvas
    #resY = 800;
    #gridX = 50;        // grid resolution of the playfield
    #gridY = 50;
    #cellSize;          // size of each cell (square)
    #grid;              // the playfield itself
    showGrid = false;   // draw grid outlines? (not recommended for large grids, slows down)

    cellState = Object.freeze({     // one JS way of making an enumeration
        DEAD:   false,
        ALIVE:  true,
    });

    constructor(canvasElement){
        this.#canvas = canvasElement;
        this.#canvas.width = this.#resX;
        this.#canvas.height = this.#resY;
        this.#ctx = canvasElement.getContext("2d");
            // ensure the playfield fits into the canvas
        this.#cellSize = Math.min(Math.floor(this.#resX / this.#gridX), Math.floor(this.#resY / this.#gridY));
        this.#grid = new Array(this.#gridX).fill(null)      // columns, must fill with null to make iterable
//            .map(() => new Array(this.#gridY).fill(this.cellState.DEAD));   // rows, initialize to dead
            .map(() => new Array(this.#gridY).fill(this.cellState.ALIVE));   // rows, initialize to dead
                // testing hack, randomize 0 or 1 (evals to true/false), comment out line above and uncomment line below
//            .map(() => new Array(this.#gridY).fill(null).map(() => Math.floor(Math.random()*2)));
        }

    drawGrid(){
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

    nextGen(){
        const newGen = this.#grid.map(arr => [...arr]);     // duplicate array using spread operator
        for(let x=0; x<this.#gridX; ++x){
            for(let y=0; y<this.#gridY; ++y){
                const adjacent = this.numNeighbors(x, y);
                if(this.#grid[x][y]){       // if current cell alive
                    ;
                }else{                      // else current cell dead
                    ;
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
    div:    undefined,
}

function init(){
    let life = new Life(document.getElementById("canvasLife"));
    lifeCfg.div = document.getElementById("divLife");
    draw(life);
    life.nextGen();
    console.log(life);
}

function update(life){
}

function draw(life){
    life.drawGrid();
}

init();
console.log("DEBUG: end of JavaScript");
