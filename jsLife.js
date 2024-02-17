import { Life } from "./Life.js";


//----
//  Global configuration and working variables.
//
const lifeCfg = {
    updateUI:       1.0,        // seconds between updating UI display data (not the playfield)
    updateUISync:   undefined,
    defaultGridX:   50,
    defaultGridY:   50,
    drawPrevPoint:  undefined,  // previous drawing point, if any
    erasePrevPoint: undefined,  // previous erasure point, if any
}

function initialize(){
        // the Life canvas and object
//    let canvasLife = document.getElementById("canvasLife");
    let life = new Life("canvasLife", lifeCfg.defaultGridX, lifeCfg.defaultGridY);
        // resize window
    window.addEventListener("resize", function(){ resizeCanvasToWindow(life); });
        // click and mousemove in canvas
    canvasLife.addEventListener("mousedown", function(e){ drawInCanvas(e, life); });
    canvasLife.addEventListener("mousemove", function(e){ drawInCanvas(e, life); });
    canvasLife.addEventListener("contextmenu", function(e){ e.preventDefault(); });     // disable the context menu
        // the grid size selector
    let gridSelector = document.getElementById("gridSelector");
    gridSelector.addEventListener("input", function(){ changeGrid(life); });
        // the FPS cap selector
    let fpsCap = document.getElementById("fpsCap");
    fpsCap.addEventListener("input", function(){ changeFPSCap(life); });
        // button to pause the simulation
    let pauseSim = document.getElementById("pauseSim");
    let stepSim = document.getElementById("stepSim");
    pauseSim.addEventListener("click", function(){ pauseSimulation(pauseSim, stepSim, life); });
    stepSim.addEventListener("click", function(){ stepSimulation(life); });
        // button to clear the playgrid
    let clearGrid = document.getElementById("clearGrid");
    clearGrid.addEventListener("click", function(){ clearPlayfield(life); });
        // button to randomize the playgrid pattern
    let randPattern = document.getElementById("randPattern");
    randPattern.addEventListener("click", function(){ randomizePattern(life); });
        // start animations to continuously update UI data
    lifeCfg.updateUISync = performance.now();
    window.requestAnimationFrame(function(){ update(life); });
}

function resizeCanvasToWindow(life){
    life.resizeCanvas();
    life.calcCellSize();
}

function drawInCanvas(e, life){
    if(e.buttons == 1){      // mouse-1 pressed
        let p = lifeCfg.drawPrevPoint;
        if(p){
            const toSet = bresenham(p[0], p[1], e.offsetX, e.offsetY);
            for(const pt of toSet){
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
    life.calcCellSize();
}

function changeFPSCap(life){            // control to change the max FPS
    const fpsCap = document.getElementById("fpsCap");
    const newCap = parseInt(fpsCap.value);
    life.setFPSCap(newCap);
}

function pauseSimulation(elPause, elStep, life){         // toggle the pause state
    if(life.isPaused){
        life.isPaused = false;
        elPause.textContent = "Pause";
        elStep.disabled = true;
    }else{
        life.isPaused = true;
        elPause.textContent = "Play";
        elStep.disabled = false;
    }
}

function stepSimulation(life){      // run simulation for a single step
    life.stepSimulation();
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
    window.requestAnimationFrame(function(){ update(life); });
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
