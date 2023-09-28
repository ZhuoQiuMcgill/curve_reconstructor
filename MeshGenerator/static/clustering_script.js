// Initialize an array to store the points for featureB
let pointsB = [];
let isCalculating = false;
let zoomLevel = 1;
let offsetX = 0;
let offsetY = 0;


// Get the canvas and context for featureB
const canvasB = document.getElementById('featureB_canvas');
const ctxB = canvasB.getContext('2d');



/** 画布功能 */
let pointRadius = 4;

let selectedPoint = null;  // 用于跟踪当前选中的点

// Function to redraw all points and the selected circle on featureB canvas
function redrawAllB() {
  clearCanvasB();
  ctxB.save();  // 保存当前的绘图状态
  ctxB.translate(offsetX, offsetY);  // 应用平移
  ctxB.scale(zoomLevel, zoomLevel);  // 应用缩放
  pointsB.forEach(point => drawPointB(point.x, point.y));
  if (selectedPoint) {
    drawSelectedPointB(selectedPoint.x, selectedPoint.y);
  }
  ctxB.restore();  // 恢复之前保存的绘图状态
}


function drawPointB(x, y) {
  ctxB.fillStyle = 'black';
  ctxB.beginPath();
  ctxB.arc(x, y, pointRadius * zoomLevel, 0, Math.PI * 2);
  ctxB.fill();
}

function drawSelectedPointB(x, y, radius = pointRadius * 2) {
  ctxB.strokeStyle = 'blue';
  ctxB.lineWidth = 1;
  ctxB.beginPath();
  ctxB.arc(x, y, radius * zoomLevel, 0, Math.PI * 2);
  ctxB.stroke();
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

canvasB.addEventListener('mousedown', function(event) {
    const rect = canvasB.getBoundingClientRect();
    const x = (event.clientX - rect.left - offsetX) / zoomLevel;
    const y = (event.clientY - rect.top - offsetY) / zoomLevel;
    const clickedPoint = { x, y };

    // Check if the click is on an existing point
    const existingPoint = pointsB.find(point => isClicked(point, clickedPoint));

    if (existingPoint) {
        if (isCalculating) {
            // Update the infoBoxB with the coordinates of the clicked point
            document.getElementById('pointInfoB').innerHTML = `Point coordinates:<br> x = ${existingPoint.x.toFixed(2)},<br> y = ${existingPoint.y.toFixed(2)}`;

            // Update the selected point
            selectedPoint = existingPoint;
        }
    } else {
        if (!isCalculating) {
            if (event.button === 0) { // Left click
                pointsB.push({ x, y });
            } else if (event.button === 2) { // Right click
                pointsB.pop();
            }
        }
        // 如果点击的是空白区域，则取消选中的点
        selectedPoint = null;
    }
    // Redraw all points and the selected circle
    redrawAllB();
});





// Prevent the context menu on right click on featureB canvas
canvasB.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});




/** 缩放功能 */
canvasB.addEventListener('wheel', function(event) {
  event.preventDefault();

  // 更新缩放级别
  if (event.deltaY < 0) {
    zoomLevel *= 1.1;
  } else {
    zoomLevel /= 1.1;
  }

  // 重新绘制所有内容
  redrawAllB();
});


/** 镜头移动功能 */
document.addEventListener('keydown', function(event) {
    const step = 20;  // 移动步长，您可以根据需要调整这个值

    switch (event.key.toLowerCase()) {
        case 'w':
            offsetY += step;
            break;
        case 'a':
            offsetX += step;
            break;
        case 's':
            offsetY -= step;
            break;
        case 'd':
            offsetX -= step;
            break;
        default:
            return;  // 如果按下的不是 WASD，不执行任何操作
    }

    redrawAllB();  // 重新绘制画布以应用新的偏移量
});





/** calculate 按钮功能 */
// Add event listener for the Calculate button
document.getElementById('calculateB').addEventListener('click', function() {
    if (pointsB.length === 0) {
        return;
    }
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
document.getElementById('clearB').addEventListener('click', function() {
    isCalculating = false;  // 重置 isCalculating 变量
    pointsB = [];  // 清空点数组
    selectedPoint = null;  // 清空选中的点
    zoomLevel = 1;  // 重置 zoomLevel 为 1（无缩放）
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


