const analyzeAssignment = async () => {
    const assignmentFile = document.getElementById('assignmentFile').files[0];
    const formData = new FormData();
    formData.append('assignmentFile', assignmentFile);

    const loadingElement = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous results

    // Show the loader by adding the 'show' class
    loadingElement.classList.add('show');

    try {
        const response = await fetch('http://localhost:7000/analyze', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        // Hide the loader once the response is received
        loadingElement.classList.remove('show');

        resultDiv.innerHTML = `
            <p><strong>Feedback:</strong> ${data.feedback || "No feedback available"}</p>
           
           
        `;
        resultDiv.style.display = 'block'; // Ensure the result div is visible
    } catch (error) {
        console.error('Error:', error);
        loadingElement.classList.remove('show');
        resultDiv.innerHTML = `<p style="color: red;">Error analyzing assignment. Please try again.</p>`;
    }
};