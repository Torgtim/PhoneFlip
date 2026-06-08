
// =====================
// SENSOR.JS v3 (FIXED)
// =====================

let tracking = false;

// rotation
let lastAlpha = null;
let lastBeta = null;
let lastGamma = null;

let rotAlpha = 0;
let rotBeta = 0;
let rotGamma = 0;

let activeAxis = "beta";
let axisLocked = false;

// motion state
let wasThrown = false;
let inAir = false;

let airFrames = 0;
let stableFrames = 0;

// catch logic (NEW SIMPLE SYSTEM)
let catchCandidate = false;
let maxImpact = 0;

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
            const permission =
                await DeviceMotionEvent.requestPermission();

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

    catchCandidate = false;
    maxImpact = 0;

    rotAlpha = rotBeta = rotGamma = 0;

    lastAlpha = lastBeta = lastGamma = null;

    axisLocked = false;
    activeAxis = "beta";

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

        resultEl.innerHTML = `
${getRotation().toFixed(0)}°<br>
${Math.round(getFlips())} FLIPS
        `;

        debugEl.innerHTML = `
Axis: ${activeAxis}<br>
Air: ${inAir}<br>
Impact: ${maxImpact.toFixed(1)}<br>
Catch: ${catchCandidate}<br>
AirFrames: ${airFrames}
        `;

    }, 100);
}

// =====================
// ROTATION
// =====================

function addRotation(prev, curr) {

    if (prev === null || curr === null) return 0;

    let diff = curr - prev;

    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return Math.abs(diff);
}

function getRotation() {

    return activeAxis === "beta"
        ? rotBeta
        : activeAxis === "gamma"
            ? rotGamma
            : rotAlpha;
}

function getFlips() {
    return getRotation() / 360;
}

// =====================
// ORIENTATION
// =====================

window.addEventListener("deviceorientation", (e) => {

    if (!tracking) return;

    rotAlpha += addRotation(lastAlpha, e.alpha);
    rotBeta  += addRotation(lastBeta, e.beta);
    rotGamma += addRotation(lastGamma, e.gamma);

    lastAlpha = e.alpha;
    lastBeta = e.beta;
    lastGamma = e.gamma;

    // auto select best axis after throw
    if (wasThrown && !axisLocked) {

        if (rotBeta >= rotAlpha && rotBeta >= rotGamma) {
            activeAxis = "beta";
        } else if (rotGamma > rotAlpha) {
            activeAxis = "gamma";
        } else {
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

    // track max impact (IMPORTANT for fail detection)
    if (magnitude > maxImpact) {
        maxImpact = magnitude;
    }

    // THROW detect
    if (magnitude > 18) {
        wasThrown = true;
    }

    // AIR detect
    if (wasThrown && magnitude < 4) {
        inAir = true;
        airFrames++;
    }

    // ✅ NEW SIMPLE CATCH RULE
    // (low acceleration after flight = hand catch)
    if (
        wasThrown &&
        inAir &&
        airFrames > 3 &&
        magnitude < 7
    ) {
        catchCandidate = true;
    }

    // stabilize after catch
    if (catchCandidate) {

        if (magnitude < 10) {
            stableFrames++;
        } else {
            stableFrames = 0;
        }

        if (stableFrames > 12) {
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

    const flips = Math.round(getFlips());

    // FAIL: too hard impact (floor/sofa suspicion)
    if (maxImpact > 35) {
        finishFail("Too hard impact");
        return;
    }

    // FAIL: no airtime
    if (airFrames < 3) {
        finishFail("No airtime");
        return;
    }

    // FAIL: no flips
    if (flips < 1) {
        finishFail("No flips");
        return;
    }

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
