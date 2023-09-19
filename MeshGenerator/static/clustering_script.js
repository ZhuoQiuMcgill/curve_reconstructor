// Initialize an array to store the points for featureB
let pointsB = [];
let isCalculating = false;

// Get the canvas and context for featureB
const canvasB = document.getElementById('featureB_canvas');
const ctxB = canvasB.getContext('2d');



/** 画布功能 */
let pointRadius = 4;

let selectedPoint = null;  // 用于跟踪当前选中的点

// Function to redraw all points and the selected circle on featureB canvas
function redrawAllB() {
  clearCanvasB();
  pointsB.forEach(point => drawPointB(point.x, point.y));
  if (selectedPoint) {
    drawSelectedPointB(selectedPoint.x, selectedPoint.y);
  }
}

// Function to draw a point on featureB canvas
function drawPointB(x, y) {
  ctxB.fillStyle = 'black';
  ctxB.beginPath();
  ctxB.arc(x, y, pointRadius, 0, Math.PI * 2);
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

function isClicked(point1, point2, radius = pointRadius * 2) {
    const distance = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    return distance <= radius;
}

function drawSelectedPointB(x, y, radius = pointRadius * 2) {  // 半径是点的半径的两倍
  ctxB.strokeStyle = 'blue';  // 蓝色
  ctxB.lineWidth = 1;
  ctxB.beginPath();
  ctxB.arc(x, y, radius, 0, Math.PI * 2);
  ctxB.stroke();
}

// Add event listener for mouse clicks on featureB canvas
canvasB.addEventListener('mousedown', function(event) {
    const rect = canvasB.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedPoint = { x, y };

    // Check if the click is on an existing point
    const existingPoint = pointsB.find(point => isClicked(point, clickedPoint));
    if (existingPoint) {
        if (isCalculating) {
            // Update the infoBoxB with the coordinates of the clicked point
            document.getElementById('pointInfoB').textContent = `Point coordinates: x = ${existingPoint.x}, y = ${existingPoint.y}`;
            // Update the selected point
            selectedPoint = existingPoint;
        }
    } else if (!isCalculating) {
        if (event.button === 0) { // Left click
            pointsB.push({ x, y });
            selectedPoint = null;  // Deselect the point when clicking on empty space

        } else if (event.button === 2) { // Right click
            pointsB.pop();
            selectedPoint = null;  // Deselect the point when removing a point
        }
    }
    // Redraw all points and the selected circle
    redrawAllB();
});


// Prevent the context menu on right click on featureB canvas
canvasB.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});





/** calculate 按钮功能 */
// Add event listener for the Calculate button
document.getElementById('calculateB').addEventListener('click', function() {
    isCalculating = true;
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
    isCalculating = false;  // 重置isCalculating变量
    pointsB = [];  // 清空点数组
    selectedPoint = null;  // 清空选中的点
    redrawAllB();  // 重新绘制画布
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


