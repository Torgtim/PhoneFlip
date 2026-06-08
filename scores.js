// =====================
// SENSOR.JS v2
// =====================

let tracking = false;

// rotation tracking
let lastAlpha = null;
let lastBeta = null;
let lastGamma = null;

let rotAlpha = 0;
let rotBeta = 0;
let rotGamma = 0;

// motion tracking
let wasThrown = false;
let inAir = false;

let airFrames = 0;
let stableFrames = 0;

let catchPhase = 0;
let catchCandidate = false;
let catchTime = 0;

let maxImpact = 0;

// selected axis (auto)
let activeAxis = null;
let axisLocked = false;

// debug
let debugInterval = null;

// UI
const readyBtn = document.getElementById("readyBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const debugEl = document.getElementById("debug");

// =====================
// START
// =====================

readyBtn.addEventListener("click", startSensors);

async function startSensors() {

    try {

        if (
            typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== "granted") return;
        }

        startChallenge();

    } catch (e) {
        console.log(e);
    }
}

function startChallenge() {

    tracking = true;

    wasThrown = false;
    inAir = false;

    airFrames = 0;
    stableFrames = 0;

    catchPhase = 0;
    catchCandidate = false;

    maxImpact = 0;

    rotAlpha = rotBeta = rotGamma = 0;

    lastAlpha = lastBeta = lastGamma = null;

    axisLocked = false;
    activeAxis = null;

    readyBtn.classList.add("ready");

    statusEl.innerHTML = "🟢 READY - THROW NOW!";
    resultEl.innerHTML = "Waiting...";

    startDebug();
}

// =====================
// DEBUG
// =====================

function startDebug() {

    if (debugInterval) clearInterval(debugInterval);

    debugInterval = setInterval(() => {

        debugEl.innerHTML = `
Axis: ${activeAxis || "none"}<br>
Alpha: ${Math.round(rotAlpha)}°<br>
Beta: ${Math.round(rotBeta)}°<br>
Gamma: ${Math.round(rotGamma)}°<br>
Air: ${inAir}<br>
Impact: ${maxImpact.toFixed(1)}<br>
Phase: ${catchPhase}
        `;

    }, 100);
}

// =====================
// ROTATION HANDLING
// =====================

function addRotation(prev, curr) {

    if (prev === null) return 0;

    let diff = curr - prev;

    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return Math.abs(diff);
}

window.addEventListener("deviceorientation", (e) => {

    if (!tracking) return;

    rotAlpha += addRotation(lastAlpha, e.alpha);
    rotBeta  += addRotation(lastBeta, e.beta);
    rotGamma += addRotation(lastGamma, e.gamma);

    lastAlpha = e.alpha;
    lastBeta = e.beta;
    lastGamma = e.gamma;

    // auto-select axis AFTER throw
    if (wasThrown && !axisLocked) {

        if (
            rotBeta > rotAlpha &&
            rotBeta > rotGamma
        ) {
            activeAxis = "beta";
        }

        else if (
            rotGamma > rotAlpha
        ) {
            activeAxis = "gamma";
        }

        else {
            activeAxis = "alpha";
        }

        axisLocked = true;
    }
});

// =====================
// MOTION
// =====================

window.addEventListener("devicemotion", (e) => {

    if (!tracking) return;

    const a = e.accelerationIncludingGravity;
    if (!a) return;

    const magnitude = Math.sqrt(
        a.x * a.x +
        a.y * a.y +
        a.z * a.z
    );

    const y = a.y || 0;

    // track max impact
    if (magnitude > maxImpact) {
        maxImpact = magnitude;
    }

    // THROW detected
    if (magnitude > 18) {
        wasThrown = true;
    }

    // AIR detection
    if (wasThrown && magnitude < 4) {
        inAir = true;
        airFrames++;
    }

    // possible catch
    if (
        wasThrown &&
        inAir &&
        airFrames > 3 &&
        magnitude > 8 &&
        !catchCandidate
    ) {
        catchCandidate = true;
        catchTime = Date.now();
    }

    // catch logic (hand movement pattern)
    if (catchCandidate) {

        const elapsed = Date.now() - catchTime;

        if (elapsed < 1000) {

            // down motion
            if (catchPhase === 0 && y < -3) {
                catchPhase = 1;
            }

            // up motion
            if (catchPhase === 1 && y > 2) {
                catchPhase = 2;
            }
        }

        // stability check
        if (magnitude < 12) {
            stableFrames++;
        } else {
            stableFrames = 0;
        }

        // finish condition
        if (stableFrames > 15 && catchPhase === 2) {
            validateRun();
        }
    }
});

// =====================
// VALIDATION
// =====================

function validateRun() {

    tracking = false;

    readyBtn.classList.remove("ready");

    clearInterval(debugInterval);

    const rawRotation =
        activeAxis === "beta"
            ? rotBeta
            : activeAxis === "gamma"
                ? rotGamma
                : rotAlpha;

    const flips = Math.round(rawRotation / 360);

    // FAIL CONDITIONS

    if (maxImpact > 35) {
        finishFail("Too much impact");
        return;
    }

    if (airFrames < 3) {
        finishFail("No airtime");
        return;
    }

    if (flips < 1) {
        finishFail("No flips");
        return;
    }

    // SUCCESS
    finishSuccess(flips);
}

// =====================
// RESULT
// =====================

function finishSuccess(flips) {

    currentScore = flips;

    resultEl.innerHTML = `🏆 ${flips} FLIPS`;
    statusEl.innerHTML = "✅ SUCCESS";

    saveScore(flips);
}

function finishFail(reason) {

    resultEl.innerHTML = "❌ FAILED";
    statusEl.innerHTML = reason;
}
