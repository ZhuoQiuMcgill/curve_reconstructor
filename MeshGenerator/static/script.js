let input_canvas = document.getElementById("input_canvas");
let ctx = input_canvas.getContext("2d");
let output_canvas = document.getElementById("output_canvas");
let ctx2 = output_canvas.getContext("2d");

let points = [];
let isDrawing = false;

document.getElementById("clearCanvas").addEventListener("click", clearCanvas);
document.getElementById("generateMesh").addEventListener("click", generateMash);
document.getElementById("btnToggle").addEventListener("click", toggleButtonState);


let btnState = 0; // 初始化按钮状态为 0（红色）

function toggleButtonState() {
    btnState = (btnState + 1) % 2; // 切换状态
    updateButtonColor(); // 更新按钮颜色
    redrawCanvas(true);
}

function updateButtonColor() {
    const btnToggle = document.getElementById("btnToggle");
    btnToggle.style.backgroundColor = btnState === 0 ? "red" : "green"; // 根据状态改变按钮颜色
}

input_canvas.addEventListener("mousedown", function(e) {
    let rect = input_canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;


    if (e.button === 2) {
        points.pop(); // 右键撤销
    } else {
        isDrawing = true;
        points.push({ x, y }); // 左键画点
    }

    ctx.clearRect(0, 0, input_canvas.width, input_canvas.height);

    // 画点
    ctx.fillStyle = 'black';
    for (let point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 当按钮状态为1时，添加连线
    if (btnState === 1) {
        ctx.strokeStyle = 'black';
        for (let i = 1; i < points.length; i++) {
            ctx.beginPath();
            ctx.moveTo(points[i - 1].x, points[i - 1].y);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();
        }

        if (points.length > 2) {
            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.stroke();
        }
    }

    if (points.length >= 1) {
        let lastPoint = points[points.length - 1];
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
});


input_canvas.addEventListener("contextmenu", function(e) {
    e.preventDefault();
});


async function generateMash() {
    // 先执行 doneDrawing 的功能
    redrawCanvas(true);

    await fetch('/api/send_points/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            points: points,  // 使用全局变量 points
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            console.log("Data sent successfully");
        }
    })
    .catch((error) => console.error('Error:', error));

    // 然后执行 fetchDataFromBackend 的功能
    // 清空 output_canvas
    ctx2.clearRect(0, 0, output_canvas.width, output_canvas.height);

    const response = await fetch('/api/receive_data/');
    const data = await response.json();
    const fetchedPoints = data.points;  // 使用不同的名称
    const lines = data.lines;

    ctx2.fillStyle = 'black';
    for (const point of fetchedPoints) {
        ctx2.beginPath();
        ctx2.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        ctx2.fill();
    }

    ctx2.strokeStyle = 'black';
    for (const line of lines) {
        ctx2.beginPath();
        ctx2.moveTo(line.start.x, line.start.y);
        ctx2.lineTo(line.end.x, line.end.y);
        ctx2.stroke();
    }
}



function clearCanvas() {
    ctx.clearRect(0, 0, input_canvas.width, input_canvas.height);
    ctx2.clearRect(0, 0, output_canvas.width, output_canvas.height);
    points.length = 0;
}

function redrawCanvas(isDoneDrawing) {
    ctx.clearRect(0, 0, input_canvas.width, input_canvas.height);

    for (let i = 0; i < points.length; i++) {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (i > 0 && btnState === 1) { // 只有在按钮状态为1（绿色）时才绘制连线
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(points[i - 1].x, points[i - 1].y);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();
        }
    }

    if (points.length >= 3 && btnState === 1) { // 只有在按钮状态为1（绿色）时才绘制连线
        let lastPoint = points[points.length - 1];
        const color = isDoneDrawing ? 'black' : 'red';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
    }
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
