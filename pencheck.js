document.addEventListener("DOMContentLoaded", function () {
    // 🔹 형광펜 캔버스 생성
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.id = "drawingCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.zIndex = "99";
    canvas.style.pointerEvents = "none"; 
    canvas.style.display = "none"; 

    const ctx = canvas.getContext("2d");
    let lines = [];
    let isDrawing = false;
    let lastPoint = null;
    const fadeOutDuration = 10000; // 🔹 형광펜이 10초 후 점점 사라짐
    let penActive = false; 

    // 🔹 펜 버튼 생성
    const penButton = document.createElement("button");
    penButton.innerText = "🖊️";
    penButton.style.position = "fixed";
    penButton.style.right = "10px"; // 🔹 화면 오른쪽 끝에 위치
    penButton.style.top = "50%";
    penButton.style.transform = "translateY(-50%)";
    penButton.style.padding = "10px 15px";
    penButton.style.backgroundColor = "#FFD700"; 
    penButton.style.color = "black";
    penButton.style.border = "none";
    penButton.style.borderRadius = "8px";
    penButton.style.cursor = "pointer";
    penButton.style.zIndex = "100";
    penButton.style.fontSize = "20px";
    penButton.style.fontWeight = "bold";
    penButton.style.transition = "background-color 0.2s ease";
    document.body.appendChild(penButton);

    // 🔹 펜 버튼 클릭 시 형광펜 On/Off
    penButton.addEventListener("click", () => {
        penActive = !penActive;
        if (penActive) {
            canvas.style.display = "block"; 
            canvas.style.pointerEvents = "auto"; 
            penButton.style.backgroundColor = "#FFA500"; 
        } else {
            canvas.style.display = "none"; 
            canvas.style.pointerEvents = "none"; 
            penButton.style.backgroundColor = "#FFD700"; 
        }
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);

    function getPoint(e) {
        if (e.type.includes("touch")) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    function startDrawing(e) {
        if (!penActive) return;

        e.preventDefault();
        isDrawing = true;
        lastPoint = getPoint(e);
        lines.push({ points: [lastPoint], opacity: 0.7, startTime: Date.now() });
        draw(e);
    }

    function draw(e) {
        if (!isDrawing || !penActive) return;

        e.preventDefault();
        const point = getPoint(e);

        if (lines.length > 0 && lastPoint) {
            const lastLine = lines[lines.length - 1];
            lastLine.points.push(point);
        }

        lastPoint = point;
        drawLines();
    }

    function drawLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        lines.forEach(line => {
            if (line.points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(line.points[0].x, line.points[0].y);

            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }

            ctx.strokeStyle = `rgba(255, 255, 0, ${line.opacity})`;
            ctx.lineWidth = 12;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        });
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function animate() {
        const currentTime = Date.now();
        lines = lines.filter(line => {
            const elapsed = currentTime - line.startTime;
            line.opacity = Math.max(0, 0.7 - elapsed / fadeOutDuration);
            return line.opacity > 0;
        });
        drawLines();
        requestAnimationFrame(animate);
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    animate();
});
