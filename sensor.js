let tracking = false;

let wasThrown = false;
let inAir = false;
let catchCandidate = false;

let totalRotation = 0;
let lastAlpha = null;

let stableFrames = 0;
let airFrames = 0;

const readyBtn =
    document.getElementById("readyBtn");

readyBtn.addEventListener(
    "click",
    startSensors
);

async function startSensors(){

    if(
        typeof DeviceMotionEvent !==
            "undefined" &&
        typeof DeviceMotionEvent
            .requestPermission ===
            "function"
    ){

        const permission =
            await DeviceMotionEvent
                .requestPermission();

        if(permission !== "granted"){
            alert("Sensors denied");
            return;
        }
    }

    startChallenge();
}

function startChallenge(){

    tracking = true;

    wasThrown = false;
    inAir = false;
    catchCandidate = false;

    totalRotation = 0;
    lastAlpha = null;

    stableFrames = 0;
    airFrames = 0;

    document.getElementById("status")
        .innerHTML =
        "🟢 READY - THROW NOW";

    document.getElementById("result")
        .innerHTML =
        "Waiting...";
}

window.addEventListener(
    "deviceorientation",
    (e)=>{

        if(!tracking) return;

        if(lastAlpha !== null){

            let diff =
                e.alpha - lastAlpha;

            if(diff > 180)
                diff -= 360;

            if(diff < -180)
                diff += 360;

            totalRotation +=
                Math.abs(diff);
        }

        lastAlpha = e.alpha;
    }
);

window.addEventListener(
    "devicemotion",
    (e)=>{

        if(!tracking) return;

        const a =
            e.accelerationIncludingGravity;

        const magnitude =
            Math.sqrt(
                a.x*a.x +
                a.y*a.y +
                a.z*a.z
            );

        // kast
        if(magnitude > 18){
            wasThrown = true;
        }

        // flytur
        if(
            wasThrown &&
            magnitude < 3
        ){
            inAir = true;
            airFrames++;
        }

        // mulig catch
        if(
            wasThrown &&
            inAir &&
            airFrames > 3 &&
            magnitude > 10
        ){
            catchCandidate = true;
        }

        // bekreft catch
        if(catchCandidate){

            if(magnitude < 12){
                stableFrames++;
            }
            else{
                stableFrames = 0;
            }

            if(stableFrames > 15){

                tracking = false;

                const flips =
                    Math.round(
                        totalRotation / 360
                    );

                if(
                    flips >= 1 &&
                    airFrames > 3
                ){
                    finishSuccess(flips);
                }
                else{
                    finishFail();
                }
            }
        }
    }
);

function finishSuccess(flips){

    currentScore = flips;

    document.getElementById("result")
        .innerHTML =
        "🏆 " + flips + " FLIPS";

    document.getElementById("status")
        .innerHTML =
        "SUCCESS";

    saveScore(flips);
}

function finishFail(){

    document.getElementById("result")
        .innerHTML =
        "❌ FAILED";

    document.getElementById("status")
        .innerHTML =
        "TRY AGAIN";
}
