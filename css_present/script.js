async function generateSlides() {
    const topic = document.getElementById("topicInput").value;
    const slideCount = document.getElementById("slideCountInput").value;
    const outputDiv = document.getElementById("output");
    const downloadLink = document.getElementById("downloadLink");

    if (!topic || !slideCount) {
        outputDiv.innerHTML = "<p>Please enter a topic and number of slides.</p>";
        return;
    }

    outputDiv.innerHTML = "<p>Generating slides...</p>";
    downloadLink.style.display = "none";

    try {
        const response = await fetch("/generate-slides", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, slideCount: parseInt(slideCount) }),
        });

        const data = await response.json();

        if (data.downloadLink) {
            outputDiv.innerHTML = "<p>Slides generated successfully!</p>";
            downloadLink.href = data.downloadLink;
            downloadLink.style.display = "block";

            downloadLink.addEventListener("click", () =>{
                downloadLink.style.display = "none"

            })
        } else {
            outputDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        }
    } catch (error) {
        outputDiv.innerHTML = "<p>Failed to generate slides.</p>";
        console.error(error);
    }
}
