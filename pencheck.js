document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.id = "drawingCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "99";
    canvas.style.touchAction = "none"; // Added for iPad

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let isDrawing = false;
    let isDragging = false;
    let lastPoint = null;
    let initialY = null;
    let lines = [];
    const fadeOutDuration = 3000;

    class Line {
        constructor() {
            this.points = [];
            this.opacity = 0.7;
            this.startTime = Date.now();
        }
    }

    function getPoint(e) {
        if (e.type.includes('touch')) {
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

    function isOverRestrictedField(x, y) {
        const elements = document.elementsFromPoint(x, y);
        return elements.some(el => ["input", "select"].includes(el.tagName.toLowerCase()));
    }

    function startDrawing(e) {
        e.preventDefault();
        e.stopPropagation();
        const point = getPoint(e);
        initialY = point.y;

        if (isOverRestrictedField(point.x, point.y)) {
            isDragging = false;
            return;
        }

        isDrawing = true;
        isDragging = true;
        lastPoint = point;
        lines.push(new Line());
        
        if (e.type.includes('touch')) {
            const touch = e.touches[0];
            lastPoint = {
                x: touch.clientX,
                y: touch.clientY
            };
        }
        draw(e);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const point = getPoint(e);

        if (lastPoint && Math.abs(point.y - initialY) > 10) {
            stopDrawing();
            return;
        }

        if (lines.length > 0 && lastPoint) {
            const lastLine = lines[lines.length - 1];
            const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);

            if (distance > 5) {
                const midpoint = {
                    x: (point.x + lastPoint.x) / 2,
                    y: (point.y + lastPoint.y) / 2,
                };
                lastLine.points.push(midpoint);
            }
        }

        lastPoint = point;
        lines[lines.length - 1].points.push(point);
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
        if (!isDragging) return;
        isDrawing = false;
        isDragging = false;
        lastPoint = null;
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

    // Touch Events
    // Touch Events with improved handling
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        e.stopPropagation();
        draw(e);
    }, { passive: false });
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        stopDrawing();
    });
    canvas.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        stopDrawing();
    });

    // Mouse Events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    animate();
});