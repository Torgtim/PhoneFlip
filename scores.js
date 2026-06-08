// =====================
// SENSOR.JS
// =====================

// ---------- State ----------

let tracking = false;

let wasThrown = false;
let inAir = false;
let catchCandidate = false;

let totalRotation = 0;
let lastAlpha = null;

let airFrames = 0;
let stableFrames = 0;

let catchPhase = 0;
let catchTime = 0;

let maxImpact = 0;

let debugInterval = null;

// ---------- Elements ----------

const readyBtn =
    document.getElementById(
        "readyBtn"
    );

const statusEl =
    document.getElementById(
        "status"
    );

const resultEl =
    document.getElementById(
        "result"
    );

const debugEl =
    document.getElementById(
        "debug"
    );

// ---------- Ready Button ----------

readyBtn.addEventListener(
    "click",
    startSensors
);

// ---------- Permissions ----------

async function startSensors() {

    try {

        if (
            selectedDevice ===
                "iphone" &&
            typeof DeviceMotionEvent !==
                "undefined" &&
            typeof DeviceMotionEvent
                .requestPermission ===
                "function"
        ) {

            const permission =
                await DeviceMotionEvent
                    .requestPermission();

            if (
                permission !==
                "granted"
            ) {

                alert(
                    "Sensor access denied."
                );

                return;
            }
        }

        startChallenge();

    }
    catch (err) {

        console.error(err);

        alert(
            "Could not access sensors."
        );
    }
}

// ---------- Start ----------

function startChallenge() {

    tracking = true;

    wasThrown = false;
    inAir = false;
    catchCandidate = false;

    totalRotation = 0;
    lastAlpha = null;

    airFrames = 0;
    stableFrames = 0;

    catchPhase = 0;
    catchTime = 0;

    maxImpact = 0;

    readyBtn.classList.add(
        "ready"
    );

    statusEl.innerHTML =
        "🟢 READY - THROW NOW";

    resultEl.innerHTML =
        "Waiting...";

    startDebug();
}

// ---------- Debug ----------

function startDebug() {

    if (debugInterval) {

        clearInterval(
            debugInterval
        );
    }

    debugInterval =
        setInterval(() => {

            debugEl.innerHTML = `
Thrown: ${wasThrown}<br>
In Air: ${inAir}<br>
Catch: ${catchCandidate}<br>
Air Frames: ${airFrames}<br>
Rotation: ${Math.round(totalRotation)}°<br>
Impact: ${maxImpact.toFixed(1)}<br>
Phase: ${catchPhase}
`;

        }, 100);
}

// ---------- Rotation ----------

window.addEventListener(
    "deviceorientation",
    (e) => {

        if (!tracking) return;

        if (
            lastAlpha !== null
        ) {

            let diff =
                e.alpha -
                lastAlpha;

            if (diff > 180)
                diff -= 360;

            if (diff < -180)
                diff += 360;

            totalRotation +=
                Math.abs(diff);
        }

        lastAlpha =
            e.alpha;
    }
);

// ---------- Motion ----------

window.addEventListener(
    "devicemotion",
    (e) => {

        if (!tracking)
            return;

        const a =
            e.accelerationIncludingGravity;

        if (!a)
            return;

        const magnitude =
            Math.sqrt(
                a.x * a.x +
                a.y * a.y +
                a.z * a.z
            );

        const y =
            a.y || 0;

        // Max impact

        if (
            magnitude >
            maxImpact
        ) {

            maxImpact =
                magnitude;
        }

        // Throw

        if (
            magnitude > 18
        ) {

            wasThrown =
                true;
        }

        // Airborne

        if (
            wasThrown &&
            magnitude < 4
        ) {

            inAir = true;

            airFrames++;
        }

        // Catch candidate

        if (
            wasThrown &&
            inAir &&
            airFrames > 3 &&
            magnitude > 9 &&
            !catchCandidate
        ) {

            catchCandidate =
                true;

            catchTime =
                Date.now();
        }

        // Catch analysis

        if (
            catchCandidate
        ) {

            const elapsed =
                Date.now() -
                catchTime;

            if (
                elapsed < 1000
            ) {

                // Down movement

                if (
                    catchPhase === 0 &&
                    y < -3
                ) {

                    catchPhase =
                        1;
                }

                // Up movement

                if (
                    catchPhase === 1 &&
                    y > 2
                ) {

                    catchPhase =
                        2;
                }
            }

            // Stable hand

            if (
                magnitude < 12
            ) {

                stableFrames++;

            } else {

                stableFrames =
                    0;
            }

            // Finish

            if (
                stableFrames >
                    15 &&
                catchPhase === 2
            ) {

                validateRun();
            }
        }
    }
);

// ---------- Validation ----------

function validateRun() {

    tracking = false;

    readyBtn.classList.remove(
        "ready"
    );

    clearInterval(
        debugInterval
    );

    const flips =
        Math.round(
            totalRotation /
            360
        );

    // Suspicious impact

    if (
        maxImpact > 35
    ) {

        finishFail(
            "Too much impact"
        );

        return;
    }

    // No airtime

    if (
        airFrames < 3
    ) {

        finishFail(
            "No airtime"
        );

        return;
    }

    // No flips

    if (
        flips < 1
    ) {

        finishFail(
            "No flips"
        );

        return;
    }

    finishSuccess(
        flips
    );
}

// ---------- Success ----------

function finishSuccess(
    flips
) {

    currentScore =
        flips;

    resultEl.innerHTML =
        `🏆 ${flips} FLIPS`;

    statusEl.innerHTML =
        "✅ SUCCESS";

    saveScore(
        flips
    );
}

// ---------- Fail ----------

function finishFail(
    reason
) {

    resultEl.innerHTML =
        "❌ FAILED";

    statusEl.innerHTML =
        reason;
}
