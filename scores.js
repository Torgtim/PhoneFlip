let currentScore = 0;

function saveScore(flips){

    let scores =
        JSON.parse(
            localStorage.getItem("flipScores")
        ) || [];

    scores.push({
        flips: flips,
        date: new Date().toLocaleString()
    });

    scores.sort((a,b)=>b.flips-a.flips);

    scores = scores.slice(0,10);

    localStorage.setItem(
        "flipScores",
        JSON.stringify(scores)
    );
}

function showScores(){

    let scores =
        JSON.parse(
            localStorage.getItem("flipScores")
        ) || [];

    let html = "<h2>🏆 TOP 10</h2>";

    scores.forEach((s,i)=>{

        html += `
        <p>
        #${i+1}
        ${s.flips} flips<br>
        ${s.date}
        </p>
        `;
    });

    document.getElementById("scores")
        .innerHTML = html;
}

async function shareScore(){

    if(!navigator.share){
        alert("Share not supported");
        return;
    }

    await navigator.share({
        title:"Phone Flip Challenge",
        text:`I got ${currentScore} flips!`,
        url:location.href
    });
}
