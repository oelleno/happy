document.addEventListener("DOMContentLoaded", function () {
    // 형광펜 캔버스 생성
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.id = "drawingCanvas";
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "auto"; 
    canvas.style.zIndex = "99"; 
    canvas.style.touchAction = "none"; 

    const ctx = canvas.getContext("2d");
    let lines = [];
    const fadeOutDuration = 3000; // 형광펜 사라지는 시간 (3초)

    function resizeCanvas() {
        const termsSections = document.querySelectorAll(".terms-section");
        if (termsSections.length === 0) return;

        let minTop = Infinity;
        let maxBottom = 0;
        let minLeft = Infinity;
        let maxRight = 0;

        termsSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < minTop) minTop = rect.top;
            if (rect.bottom > maxBottom) maxBottom = rect.bottom;
            if (rect.left < minLeft) minLeft = rect.left;
            if (rect.right > maxRight) maxRight = rect.right;
        });

        canvas.style.left = minLeft + "px";
        canvas.style.top = minTop + "px";
        canvas.width = maxRight - minLeft;
        canvas.height = maxBottom - minTop;

        const checkboxes = document.querySelectorAll('input[name="terms_agree"], input[name="24h_terms_agree"], input[name="refund_terms_agree"]');
        checkboxes.forEach(checkbox => {
            checkbox.style.position = "relative";
            checkbox.style.zIndex = "100";
        });
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let isDrawing = false;
    let lastPoint = null;

    function getPoint(e) {
        if (e.type.includes('touch')) {
            return {
                x: e.touches[0].clientX - canvas.offsetLeft,
                y: e.touches[0].clientY - canvas.offsetTop
            };
        }
        return {
            x: e.clientX - canvas.offsetLeft,
            y: e.clientY - canvas.offsetTop
        };
    }

    function isOverCheckbox(x, y) {
        const checkboxes = document.querySelectorAll('input[name="terms_agree"], input[name="24h_terms_agree"], input[name="refund_terms_agree"]');
        return Array.from(checkboxes).some(checkbox => {
            const rect = checkbox.getBoundingClientRect();
            return (
                x >= rect.left - canvas.offsetLeft &&
                x <= rect.right - canvas.offsetLeft &&
                y >= rect.top - canvas.offsetTop &&
                y <= rect.bottom - canvas.offsetTop
            );
        });
    }

    function startDrawing(e) {
        const termsSections = document.querySelectorAll(".terms-section");
        const point = getPoint(e);
        let insideTerms = false;

        termsSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (point.x >= rect.left - canvas.offsetLeft &&
                point.x <= rect.right - canvas.offsetLeft &&
                point.y >= rect.top - canvas.offsetTop &&
                point.y <= rect.bottom - canvas.offsetTop) {
                insideTerms = true;
            }
        });

        if (!insideTerms || isOverCheckbox(point.x, point.y)) {
            canvas.style.pointerEvents = "none"; 
            return;
        } else {
            canvas.style.pointerEvents = "auto"; 
        }

        e.preventDefault();
        isDrawing = true;
        lastPoint = point;
        lines.push({ points: [point], opacity: 0.7, startTime: Date.now() });
        draw(e);
    }

    function draw(e) {
        if (!isDrawing) return;
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
