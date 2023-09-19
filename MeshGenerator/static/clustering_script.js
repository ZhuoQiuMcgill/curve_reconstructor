// Initialize an array to store the points for featureB
let pointsB = [];

// Get the canvas and context for featureB
const canvasB = document.getElementById('featureB_canvas');
const ctxB = canvasB.getContext('2d');



/** 画布功能 */
// Function to draw a point on featureB canvas
function drawPointB(x, y) {
  ctxB.fillStyle = 'black';
  ctxB.beginPath();
  ctxB.arc(x, y, 5, 0, Math.PI * 2);
  ctxB.fill();
}

// Function to clear the featureB canvas
function clearCanvasB() {
  ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
}

// Function to redraw all points on featureB canvas
function redrawPointsB() {
  clearCanvasB();
  pointsB.forEach(point => drawPointB(point.x, point.y));
}

// Add event listener for mouse clicks on featureB canvas
canvasB.addEventListener('mousedown', function(event) {
  const rect = canvasB.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (event.button === 0) { // Left click
    pointsB.push({ x, y });
    drawPointB(x, y);
  } else if (event.button === 2) { // Right click
    pointsB.pop();
    redrawPointsB();
  }
});

// Prevent the context menu on right click on featureB canvas
canvasB.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});





/** calculate 按钮功能 */
// Add event listener for the Calculate button
document.getElementById('calculateB').addEventListener('click', function() {
  // Send the points to the backend
  fetch('/api/send_clustering_points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ points: pointsB })
  }).then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});





/** clear 按钮功能 */
// Add event listener for the Clear button
document.getElementById('clearB').addEventListener('click', function() {
    // Clear the points array for featureB
    pointsB.length = 0;

    // Clear the featureB canvas
    clearCanvasB();
});





/** goto 按钮功能 */
// Placeholder for max_length, which will be received from the backend later
let maxLength = 10;  // Initialize to 0

// Function to update maxLength from the backend
async function updateMaxLength() {
    // Fetch the max_length from the backend
    // Replace the URL and key according to your actual API
    const response = await fetch('/api/get_max_length/');
    const data = await response.json();
    maxLength = data.max_length;

    // Update the max attribute of the input element
    document.getElementById('gotoPageB').max = maxLength;
}

// Add event listener to the gotoPageB input to enforce the min and max values
document.getElementById('gotoPageB').addEventListener('input', function() {
    const input = document.getElementById('gotoPageB');
    if (parseInt(input.value) < 0) {
        input.value = 0;
    } else if (parseInt(input.value) > maxLength) {
        input.value = maxLength;
    }
});


