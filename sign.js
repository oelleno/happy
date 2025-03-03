var dictationCanvas = null;
var dictationCtx = null;
var isDrawing = false;
var lastX = 0;
var lastY = 0;
var dictationResult = '';

function initDictationCanvas(targetWord, callback) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 1000;
  `;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  `;

  dictationCanvas = document.createElement('canvas');
  dictationCanvas.width = 400;
  dictationCanvas.height = 200;
  dictationCanvas.style.cssText = `
    border: 1px solid #ccc;
    background: white;
  `;

  const guideText = document.createElement('div');
  const popupWidth = Math.min(window.innerWidth * 0.8, 800);
  const fontSize = Math.floor(popupWidth * 0.06); // 6% of popup width
  guideText.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ccc;
    font-size: ${fontSize}px;
    pointer-events: none;
    width: 100%;
    text-align: center;
  `;
  guideText.textContent = targetWord;

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '지우기';
  clearBtn.style.cssText = `
    display: inline-block;
    margin: 10px 5px 0;
    padding: 5px 20px;
    border: none;
    background: #4CAF50;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '서명 완료';
  closeBtn.style.cssText = `
    display: inline-block;
    margin: 10px 5px 0;
    padding: 5px 20px;
    border: none;
    background: #0078D7;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    text-align: center;
  `;
  buttonContainer.appendChild(clearBtn);
  buttonContainer.appendChild(closeBtn);


  popup.appendChild(dictationCanvas);
  popup.appendChild(guideText);
  popup.appendChild(buttonContainer);
  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  dictationCtx = dictationCanvas.getContext('2d');
  dictationCtx.strokeStyle = '#000000';
  dictationCtx.lineWidth = 5;
  dictationCtx.lineCap = 'round';

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const rect = dictationCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    dictationCtx.beginPath();
    dictationCtx.moveTo(lastX, lastY);
    dictationCtx.lineTo(x, y);
    dictationCtx.stroke();

    [lastX, lastY] = [x, y];
  }

  function startDrawing(e) {
    isDrawing = true;
    const rect = dictationCanvas.getBoundingClientRect();
    lastX = (e.clientX || e.touches[0].clientX) - rect.left;
    lastY = (e.clientY || e.touches[0].clientY) - rect.top;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  dictationCanvas.addEventListener('mousedown', startDrawing);
  dictationCanvas.addEventListener('mousemove', draw);
  dictationCanvas.addEventListener('mouseup', stopDrawing);
  dictationCanvas.addEventListener('mouseleave', stopDrawing);

  dictationCanvas.addEventListener('touchstart', startDrawing);
  dictationCanvas.addEventListener('touchmove', draw);
  dictationCanvas.addEventListener('touchend', stopDrawing);

  clearBtn.addEventListener('click', () => {
    dictationCtx.clearRect(0, 0, dictationCanvas.width, dictationCanvas.height);
  });

  closeBtn.addEventListener('click', () => {
    if (callback) {
      // Get the image data as base64
      const imageData = dictationCanvas.toDataURL();

      // Create a temporary canvas to resize the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const img = new Image();

      img.onload = function() {
        // Set canvas size to match the target text element size
        const textElement = document.querySelector('.dictation-text[data-text="' + targetWord + '"]');
        const rect = textElement.getBoundingClientRect();

        tempCanvas.width = rect.width;
        tempCanvas.height = rect.height;

        // Clear and draw resized image
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

        // Pass the resized image data to callback
        callback(tempCanvas.toDataURL());
      };

      img.src = imageData;
    }
    document.body.removeChild(overlay);
    document.body.removeChild(popup);
  });
}