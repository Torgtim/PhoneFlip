// =====================
// SCORES.JS
// =====================

let currentScore = 0;

// ---------------------
// Save Score
// ---------------------

function saveScore(flips) {

    let scores =
        JSON.parse(
            localStorage.getItem(
                "phoneFlipScores"
            )
        ) || [];

    scores.push({

        flips: flips,

        date: new Date()
            .toLocaleString()
    });

    scores.sort(
        (a, b) => b.flips - a.flips
    );

    scores = scores.slice(0, 10);

    localStorage.setItem(
        "phoneFlipScores",
        JSON.stringify(scores)
    );
}

// ---------------------
// Show Scores
// ---------------------

function showScores() {

    const container =
        document.getElementById(
            "scoreContainer"
        );

    let scores =
        JSON.parse(
            localStorage.getItem(
                "phoneFlipScores"
            )
        ) || [];

    if (scores.length === 0) {

        container.innerHTML = `
            <h3>🏆 High Scores</h3>
            <p>No scores yet!</p>
        `;

        return;
    }

    let html =
        "<h3>🏆 Top 10</h3>";

    scores.forEach((score, index) => {

        html += `
            <div class="scoreEntry">

                <strong>
                    #${index + 1}
                </strong>

                <br>

                ${score.flips} flips

                <br>

                <small>
                    ${score.date}
                </small>

            </div>
        `;
    });

    container.innerHTML = html;
}

// ---------------------
// Clear Scores
// (Optional)
// ---------------------

function clearScores() {

    localStorage.removeItem(
        "phoneFlipScores"
    );

    showScores();
}

// ---------------------
// Share Score
// ---------------------

async function shareScore() {

    if (
        !navigator.share
    ) {

        alert(
            "Sharing is not supported on this device."
        );

        return;
    }

    try {

        await navigator.share({

            title:
                "Phone Flip Challenge",

            text:
                `I got ${currentScore} flips in Phone Flip Challenge! 📱🏆`,

            url:
                location.href
        });

    }
    catch (err) {

        console.log(
            "Share cancelled"
        );
    }
}

// ---------------------
// Button Events
// ---------------------

window.addEventListener(
    "load",
    () => {

        const scoreBtn =
            document.getElementById(
                "scoreBtn"
            );

        const shareBtn =
            document.getElementById(
                "shareBtn"
            );

        if (scoreBtn) {

            scoreBtn.addEventListener(
                "click",
                showScores
            );
        }

        if (shareBtn) {

            shareBtn.addEventListener(
                "click",
                shareScore
            );
        }
    }
);
