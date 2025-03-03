async function handleSubmit() {
  try {
    // First save to Firebase
    await submitForm();

    // Then generate and download image
    downloadAsImage();
    // ✅ Firestore에 `imageUrl`이 저장된 후 버튼 활성화
    //document.getElementById('sendKakao').style.display = 'block'; //Removed as per request
  } catch (error) {
    console.error("Error submitting form:", error);
    alert(error.message || "양식 제출 중 오류가 발생했습니다.");
  }
}

function validateForm() {
  const requiredFields = ['name', 'contact', 'birthdate', 'main_address', 'membership'];
  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value.trim()) {
      throw new Error(`필수 항목을 모두 입력해주세요.`);
    }
  }
  return true;
}

function downloadAsImage() {
  const container = document.querySelector('.container');
  html2canvas(container, {
    backgroundColor: '#f5f5f5',
    scale: 1.0,
    useCORS: true
  }).then(canvas => {
    console.log("📸 이미지 변환 완료");

    // Get current date in YYMMDD format
    const now = new Date();
    const year = now.getFullYear().toString().slice(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = year + month + day;

    // Get member name
    const memberName = document.getElementById('name').value;

    // Get the docId from Firebase submission
    const dailyNumber = localStorage.getItem('current_doc_number');
    if (!dailyNumber) {
      console.error('Document number not found');
      return;
    }

    // Create filename using Firebase document number
    const fileName = `${dateStr}_${dailyNumber}_${memberName}.jpg`;

    // Convert canvas to blob and upload to Firebase Storage
    canvas.toBlob(async (blob) => {
      try {
        await window.uploadImage(fileName, blob);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
      }
    }, 'image/jpeg');

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
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 0 20px rgba(0,0,0,0.4);
      z-index: 1000;
      text-align: center;
      min-width: 300px;
      min-height: 180px;
      font-size: 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    `;

    const statusText = document.createElement('h3');
    statusText.textContent = '계약서 업로드 중...';
    statusText.style.cssText = `
      margin-top: 0px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      white-space: nowrap; /* 줄바꿈 방지 */
    `;
    popup.appendChild(statusText);

    setTimeout(() => {
      statusText.textContent = '계약서 업로드 완료!';
      setTimeout(() => {
        statusText.textContent = '계약서URL 저장 완료!';
        setTimeout(() => {
          statusText.style.display = 'none';

          // Create button container for vertical layout
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
          `;

          // 영수증 저장 버튼 생성
          const receiptBtn = document.createElement('button');
          receiptBtn.textContent = '영수증 저장';
          receiptBtn.onclick = function() {
              if (!window.docId) {
                  alert('계약서 번호를 찾을 수 없습니다.');
                  return;
              }
              localStorage.setItem('receipt_doc_id', window.docId);
              window.location.href = 'receipt.html';
          };
          receiptBtn.style.cssText = `
              padding: 10px 20px;
              background: #0078D7;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              font-size: 16px;
              width: 200px;
          `;

          // 버튼을 팝업에 추가
          buttonContainer.appendChild(receiptBtn);
          popup.appendChild(buttonContainer);


        }, 1000);
      }, 1000);
    }, 1000);

    document.body.appendChild(popup);
    console.log("🎉 팝업 생성 완료");


  }).catch(error => {
    console.error("❌ html2canvas 실행 중 오류 발생:", error);
  });
}

// 📌Canvas
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.querySelector(".canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const colors = document.getElementsByClassName("jsColor");

    const INITIAL_COLOR = "#000000";
    canvas.width = 180;  // Match canvas element width
    canvas.height = 50;  // Match canvas element height

    ctx.strokeStyle = "#2c2c2c";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = INITIAL_COLOR;
    ctx.fillStyle = INITIAL_COLOR;
    ctx.lineWidth = 2.5;
  }
});

let painting = false;
let filling = false;

function stopPainting() {
  painting = false;
}

function startPainting() {
  painting = true;
}

function onMouseMove(event) {
  const x = event.offsetX;
  const y = event.offsetY;
  if (!painting) {
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.querySelector(".canvas");
  if (canvas) {
    canvas.addEventListener('click', function(e) {
      e.preventDefault();

      const popup = document.createElement('div');
      popup.style.cssText = `
    position: fixed;
    top: 50 %;
    left: 50 %;
    transform: translate(-50 %, -50 %);
    background: white;
    padding: 20px;
    border - radius: 10px;
    box - shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    z - index: 1000;
    font-size: 16px; /* Increased font size */
    `;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100 %;
    height: 100 %;
    background: rgba(0, 0, 0, 0.5);
    z - index: 999;
    `;

      const popupCanvas = document.createElement('canvas');
      popupCanvas.width = 400;
      popupCanvas.height = 200;
      popupCanvas.style.border = '1px solid #ccc';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '서명 완료';
      closeBtn.style.cssText = `
    display: block;
    margin: 10px auto 0;
    padding: 5px 20px;
    border: none;
    background: #0078D7;
    color: white;
    border - radius: 5px;
    cursor: pointer;
    font-size: 16px; /* Increased font size */
    `;

      popup.appendChild(popupCanvas);
      popup.appendChild(closeBtn);
      document.body.appendChild(overlay);
      document.body.appendChild(popup);

      const popupCtx = popupCanvas.getContext('2d');
      popupCtx.strokeStyle = '#000000';
      popupCtx.lineWidth = 2;
      popupCtx.lineCap = 'round';

      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;

      function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = popupCanvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        popupCtx.beginPath();
        popupCtx.moveTo(lastX, lastY);
        popupCtx.lineTo(x, y);
        popupCtx.stroke();
        [lastX, lastY] = [x, y];
      }

      popupCanvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        const rect = popupCanvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
      });

      popupCanvas.addEventListener('mousemove', draw);
      popupCanvas.addEventListener('mouseup', () => isDrawing = false);
      popupCanvas.addEventListener('mouseleave', () => isDrawing = false);

      popupCanvas.addEventListener('touchstart', function(e) {
        isDrawing = true;
        const rect = popupCanvas.getBoundingClientRect();
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
      });

      popupCanvas.addEventListener('touchmove', draw);
      popupCanvas.addEventListener('touchend', () => isDrawing = false);

      closeBtn.addEventListener('click', () => {
        // Copy signature to original canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(popupCanvas, 0, 0, canvas.width, canvas.height);
        document.body.removeChild(overlay);
        document.body.removeChild(popup);
      });
    });
  }
});

function sendit() {
  const name = document.getElementById('name'); // 이름
  const contact = document.getElementById('contact'); // 연락처
  const birthdate = document.getElementById('birthdate'); // 생년월일
  const membership = document.getElementById('membership'); // 회원권 선택
  const rentalMonths = document.getElementById('rental_months'); // 운동복 대여 개월수
  const lockerMonths = document.getElementById('locker_months'); // 라커 대여 개월수
  const exerciseGoals = document.getElementsByName('goal'); // 운동목적
  const otherGoal = document.getElementById('other'); // 기타 입력 칸
  const paymentMethods = document.getElementsByName('payment'); // 결제 방법
  const zipcode = document.getElementById('sample6_postcode'); // 주소
  const referralSources = document.getElementsByName('referral'); // 가입경로 

  // 정규식
  const expNameText = /^[가-힣]+$/;
  const expContactText = /^\d{3}-\d{4}-\d{4}$/; // 연락처 형식 체크

  if (name.value == '') {
    alert('이름을 입력하세요');
    name.focus();
    return false;
  }

  if (!/^[가-힣]{2,5}$/.test(name.value)) {
    alert('이름을 한글로 입력해주세요');
    name.focus();
    return false;
  }

  if (contact.value == '') {
    alert('연락처를 입력하세요');
    contact.focus();
    return false;
  }

  if (!expContactText.test(contact.value)) { // 연락처 형식 체크
    alert('연락처 형식을 확인하세요 (예: 000-0000-0000)');
    contact.focus();
    return false;
  }


  if (membership.value == '') {
    alert('회원권 선택을 해주세요');
    membership.focus();
    return false;
  }

  if (rentalMonths.value == '' || rentalMonths.value < 1) {
    alert('운동복 대여 개월수를 입력해주세요');
    rentalMonths.focus();
    return false;
  }

  if (lockerMonths.value == '' || lockerMonths.value < 0) {
    alert('라커 대여 개월수를 입력해주세요');
    lockerMonths.focus();
    return false;
  }

  let count = 0;

  for (let i in exerciseGoals) {
    if (exerciseGoals[i].checked) {
      count++;
    }
  }

  if (count == 0) {
    alert('운동목적을 선택하세요');
    return false;
  }

  // 기타 항목 체크
  if (otherGoal.value.trim() !== '') {
    count++;
  }

  // 결제 방법 체크
  let paymentSelected = false;
  for (let i in paymentMethods) {
    if (paymentMethods[i].checked) {
      paymentSelected = true;
      break;
    }
  }

  if (!paymentSelected) {
    alert('결제 방법을 선택하세요');
    return false;
  }


  // 가입경로 체크
  let referralSelected = false;
  for (let i in referralSources) {
    if (referralSources[i].checked) {
      referralSelected = true;
      break;
    }
  }

  if (!referralSelected) {
    alert('가입경로를 선택하세요');
    return false;
  }

  if (zipcode.value == '') {
    alert('주소를 입력하세요');
    zipcode.focus();
    return false;
  }

  return true;
}

function formatBirthdate(input) {
  let value = input.value.replace(/\D/g, '');

  if (value.length === 6) {
    value = '19' + value;
  }

  if (value.length === 8) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    input.value = `${year} -${month} -${day} `;
  }
}

function moveFocus() {
  const ssn1 = document.getElementById('ssn1');
  if (ssn1.value.length >= 6) {
    document.getElementById('ssn2').focus();
  }
}

function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, ''); // 숫자만 남기기

  if (value.length >= 11) {
    value = value.substring(0, 11); // 최대 11자리로 제한
    value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (value.length > 7) {
    value = value.replace(/(\d{3})(\d{4})/, '$1-$2');
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})/, '$1-');
  }

  input.value = value; // 변환된 값 설정
}

// 📌 운동시간 체크
function handleTimeSelect(select) {
  const checkbox = select.parentElement.querySelector('input[type="checkbox"][name="workout_time"]');
  if (select.value !== "") {
    checkbox.checked = true;
  } else {
    checkbox.checked = false;
  }
}

function handleWorkoutTimeChange(checkbox) {
  const select = checkbox.parentElement.querySelector('select[data-workout-time]');
  if (!checkbox.checked) {
    select.value = ""; // 체크 해제 시 드롭다운 값을 비움
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const timeSelects = document.querySelectorAll('select[data-workout-time]');
  timeSelects.forEach(select => {
    select.addEventListener('change', () => handleTimeSelect(select));
  });

  const checkboxes = document.querySelectorAll('input[type="checkbox"][name="workout_time"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => handleWorkoutTimeChange(checkbox));
  });
});


// 📌 전화번호 입력 필드에서 자동 변환 적용
document.addEventListener("DOMContentLoaded", function() {
  const phoneInput = document.getElementById("contact");
  if (phoneInput) {
    // Get phone from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');
    if (phone) {
      phoneInput.value = phone;
      phoneInput.readOnly = true;
      phoneInput.style.backgroundColor = '#f5f5f5';
    }

    phoneInput.addEventListener("input", function() {
      formatPhoneNumber(this);
    });
  }
});


// 복합결제 payment popup
function updatePaymentSummary() {
  const paymentSummary = document.getElementById('payment-summary');
  const paymentItems = document.querySelectorAll('#payment-items input');
  const unpaidField = document.getElementById('unpaid');
  const totalAmountStr = document.getElementById('total_amount').value;
  const totalAmount = parseInt(totalAmountStr.replace(/[^\d]/g, '')) || 0;

  let summaryHtml = '';
  let total = 0;

  paymentItems.forEach((input, index) => {
    if (index % 2 === 0) { // Description input
      const description = input.value;
      const amount = paymentItems[index + 1]?.value || '0';
      if (description && amount) {
        const numAmount = parseInt(amount.replace(/[^\d]/g, '')) || 0;
        total += numAmount;
        summaryHtml += `<div>${description}: ${amount}</div>`;
      }
    }
  });

  if (paymentSummary) {
    if (summaryHtml) {
      summaryHtml += `<div style="margin-top: 8px; border-top: 1px solid #ccc; padding-top: 8px;"><strong>결제완료: ${total.toLocaleString('ko-KR')}원</strong></div>`;
      paymentSummary.innerHTML = summaryHtml;

      // Calculate and update unpaid amount
      const unpaidAmount = totalAmount - total;
      if (unpaidField) {
        unpaidField.value = '결제예정 ₩' + (unpaidAmount > 0 ? unpaidAmount.toLocaleString('ko-KR') : '0');
        unpaidField.style.backgroundColor = unpaidAmount > 0 ? '#ffebeb' : '#f5f5f5';
      }
    }
  }
}

function showCardPaymentPopup() {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      z-index: 1000;
      min-width: 300px;
      font-size: 16px; /* Increased font size */
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

    const paymentContainer = document.createElement('div');
    paymentContainer.id = 'payment-items';
    paymentContainer.style.marginBottom = '20px';

    // Total amount display
    const totalDisplay = document.createElement('div');
    totalDisplay.style.cssText = `
      margin-top: 20px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 5px;
      text-align: right;
      font-weight: bold;
      font-size: 16px; /* Increased font size */
    `;
    totalDisplay.textContent = '합계: ₩ 0';

    function addPaymentRow(description = '', isReadOnly = false, isFaded = false) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        align-items: center;
      `;

      const addBtn = document.createElement('button');
      addBtn.innerHTML = '+';
      addBtn.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 4px;
        border: none;
        background: #4CAF50;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      addBtn.onclick = function() { 
        addPaymentRow(); 
      };

      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.style.cssText = 'width: 150px; padding: 5px; border-radius: 5px; border: 1px solid #ccc; font-size: 16px;';
      descInput.placeholder = '결제 내용';
      if (description) {
        descInput.value = description;
      }
      
      // Apply read-only and faded styling if needed
      if (isReadOnly) {
        descInput.readOnly = true;
        descInput.style.backgroundColor = '#f5f5f5';
      }
      
      if (isFaded) {
        descInput.style.color = '#aaa';
        descInput.style.fontStyle = 'italic';
        
        // Add focus and input event listeners to handle placeholder behavior
        descInput.addEventListener('focus', function() {
          if (this.value === '(직접입력)') {
            this.value = '';
            this.style.color = '#000';
            this.style.fontStyle = 'normal';
          }
        });
        
        descInput.addEventListener('blur', function() {
          if (this.value === '') {
            this.value = '(직접입력)';
            this.style.color = '#aaa';
            this.style.fontStyle = 'italic';
          }
        });
        
        descInput.addEventListener('input', function() {
          this.style.color = '#000';
          this.style.fontStyle = 'normal';
        });
      }

      const amountInput = document.createElement('input');
      amountInput.type = 'text';
      amountInput.style.cssText = 'width: 150px; padding: 5px; border-radius: 5px; border: 1px solid #ccc; font-size: 16px;';
      amountInput.placeholder = '(₩)금액입력';
      amountInput.setAttribute('inputmode', 'numeric');
      amountInput.oninput = function() {
        formatCurrency(this);
        updateTotal();
      };
      amountInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
          confirmButton.click();
        }
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 4px;
        border: none;
        background: #ff4444;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      deleteBtn.onclick = function() {
        row.remove();
        updateTotal();
      };

      row.appendChild(addBtn);
      row.appendChild(descInput);
      row.appendChild(amountInput);
      row.appendChild(deleteBtn);
      paymentContainer.appendChild(row);
    }

    function updateTotal() {
      let total = 0;
      paymentContainer.querySelectorAll('input[type="text"]:nth-child(3)').forEach(input => {
        const value = parseInt(input.value.replace(/[^\d]/g, '')) || 0;
        total += value;
      });
      totalDisplay.textContent = '합계: ₩ ' + total.toLocaleString('ko-KR');
    }

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '확인';
    confirmButton.style.cssText = `
      padding: 8px 20px;
      background: #0078D7;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      float: right;
      font-size: 16px; /* Increased font size */
    `;

    confirmButton.onclick = function() {
      updatePaymentSummary();
      document.body.removeChild(overlay);
      document.body.removeChild(popup);
    };

    popup.appendChild(paymentContainer);
    popup.appendChild(totalDisplay);
    popup.appendChild(confirmButton);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Add default payment options
    addPaymentRow('카드', true);
    addPaymentRow('현금', true);
    addPaymentRow('계좌이체', true);
  }

// Add event listener for card checkbox
document.addEventListener('DOMContentLoaded', function() {
  const combinedPaymentRadio = document.querySelector('input[type="radio"][value="복합결제"]');
  if (combinedPaymentRadio) {
    combinedPaymentRadio.addEventListener('change', function() {
      if (this.checked) {
        showCardPaymentPopup();
      }
    });
  }
});

// 📌 회원권 가격
function updateAdmissionFee() {
  const membershipSelect = document.getElementById("membership");
  const admissionFeeInput = document.getElementById("admission_fee");

  if (!membershipSelect || !admissionFeeInput) return;

  let fee = '₩ 0';
  if (membershipSelect.value === "New") {
    fee = '₩ ' + (33000).toLocaleString('ko-KR');
  }

  admissionFeeInput.value = fee.toLocaleString("ko-KR");
  admissionFeeInput.style.backgroundColor = "#f5f5f5";
  admissionFeeInput.readOnly = true;
  calculateTotal(); // Added to update total on membership change
}


// 📌 운동복 가격
function updateRentalPrice(select) {
  const rentalPrice = document.getElementById('rental_price');
  if (rentalPrice) {
    if (select.value) {
      const monthlyFee = 11000;
      const total = parseInt(select.value) * monthlyFee;
      rentalPrice.value = '₩ ' + total.toLocaleString('ko-KR');
    } else {
      rentalPrice.value = '₩ 0';
    }
    calculateTotal();
  }
}

// 📌 라커 가격
function updateLockerPrice(select) {
  const lockerPrice = document.getElementById('locker_price');
  if (lockerPrice) {
    if (select.value) {
      const monthlyFee = 11000;
      const total = parseInt(select.value) * monthlyFee;
      lockerPrice.value = '₩ ' + total.toLocaleString('ko-KR');
    } else {
      lockerPrice.value = '₩ 0';
    }
    calculateTotal();
  }
}

// 📌 기간회비 가격
function updateMembershipFee(select) {
  const membershipFee = document.getElementById('membership_fee');
  if (membershipFee) {
    let fee = 0;
    switch (parseInt(select.value)) {
      case 1: fee = 99000; break;
      case 2: fee = 154000; break;
      case 3: fee = 198000; break;
      case 6: fee = 297000; break;
      case 12: fee = 429000; break;
      default: fee = 0;
    }
    membershipFee.value = '₩ ' + fee.toLocaleString('ko-KR');
    calculateTotal(); // Added to update total on membership fee change
  }
}


function formatCurrency(input) {
  let value = input.value.replace(/[^\d]/g, "");
  value = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(value);
  value = value.replace("₩", "").trim();
  input.value = value;
}

function showDiscountPopup() {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    z-index: 1000;
    min-width: 250px;
    font-size: 16px; /* Increased font size */
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

  const discountContainer = document.createElement('div');
  discountContainer.id = 'discount-items';

  function addDiscountRow() {
    const row = document.createElement('div');
    row.style.marginBottom = '10px';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.alignItems = 'center';

    const select = document.createElement('select');
    select.style.cssText = 'flex: 1; padding: 5px; border-radius: 5px; font-size: 16px;';
    select.innerHTML = `
      <option value="">할인 항목 선택</option>
      <option value="운동복">운동복 할인</option>
      <option value="라커">라커 할인</option>
      <option value="직접입력">직접입력</option>
    `;

    const itemInput = document.createElement('input');
    itemInput.type = 'text';
    itemInput.style.cssText = 'width: 150px; padding: 5px; border-radius: 5px; display: none; font-size: 16px;';
    itemInput.placeholder = '할인 항목 입력';

    select.onchange = function() {
      itemInput.style.display = this.value === '직접입력' ? 'block' : 'none';
    };

    const input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = 'width: 150px; padding: 5px; border-radius: 5px; font-size: 16px;';
    input.placeholder = '(₩)금액입력';
    input.setAttribute('inputmode', 'numeric');
    input.oninput = function() { formatCurrency(this); };
    input.onkeypress = function(e) {
      if (e.key === 'Enter') {
        confirmButton.click();
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: none;
      background: #ff4444;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin-left: 5px;
    `;
    deleteBtn.onclick = function() {
      row.remove();
      calculateTotal(); // Added to recalculate total after removing a discount row
    };

    row.appendChild(select);
    row.appendChild(itemInput);
    row.appendChild(input);
    row.appendChild(deleteBtn);
    discountContainer.appendChild(row);
  }

  const addButton = document.createElement('button');
  addButton.textContent = '할인 추가';
  addButton.style.cssText = `
    margin: 10px 0;
    padding: 5px 15px;
    background: #0078D7;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px; /* Increased font size */
  `;
  addButton.onclick = addDiscountRow;

  const confirmButton = document.createElement('button');
  confirmButton.textContent = '확인';
  confirmButton.style.cssText = `
    margin: 10px 0;
    padding: 5px 15px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-left: 10px;
    font-size: 16px; /* Increased font size */
  `;

  confirmButton.onclick = function() {
    let total = 0;
    discountContainer.querySelectorAll('input').forEach(input => {
      const value = parseInt(input.value.replace(/[^\d]/g, '')) || 0;
      total += value;
    });

    const discountInput = document.getElementById('discount');
    discountInput.value = '₩ ' + total.toLocaleString('ko-KR');
    calculateTotal();

    document.body.removeChild(overlay);
    document.body.removeChild(popup);
  };

  popup.appendChild(discountContainer);
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; justify-content: center; gap: 10px;';
  buttonContainer.appendChild(addButton);
  buttonContainer.appendChild(confirmButton);
  popup.appendChild(buttonContainer);

  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  addDiscountRow(); // Add first row by default
}

function calculateTotal() {
  const admissionFee = parseInt(document.getElementById('admission_fee').value.replace(/[^\d]/g, '') || 0);
  const rentalPrice = parseInt(document.getElementById('rental_price').value.replace(/[^\d]/g, '') || 0);
  const lockerPrice = parseInt(document.getElementById('locker_price').value.replace(/[^\d]/g, '') || 0);
  const membershipFee = parseInt(document.getElementById('membership_fee').value.replace(/[^\d]/g, '') || 0);
  const discount = parseInt(document.getElementById('discount').value.replace(/[^\d]/g, '') || 0);

  const total = admissionFee + rentalPrice + lockerPrice + membershipFee - discount;
  const totalAmount = document.getElementById('total_amount');
  const unpaidField = document.getElementById('unpaid');

  totalAmount.value = '₩ ' + total.toLocaleString('ko-KR');

  // ✅ combinedPaymentRadio를 함수 맨 위에서 선언하여 전체 함수에서 사용 가능하도록 변경
  const combinedPaymentRadio = document.querySelector('input[type="radio"][value="복합결제"]');

  let unpaidAmount = 0;
  let combinedPaymentTotal = 0;

  if (combinedPaymentRadio && combinedPaymentRadio.checked) {
    combinedPaymentTotal = getCombinedPaymentTotal();
    unpaidAmount = total - combinedPaymentTotal;
    unpaidField.value = '결제예정 ₩' + (unpaidAmount > 0 ? unpaidAmount.toLocaleString('ko-KR') : '0');
    unpaidField.style.backgroundColor = unpaidAmount > 0 ? '#ffebeb' : '#f5f5f5';
  } else {
    unpaidField.value = '';
    unpaidField.style.backgroundColor = '#f5f5f5';
  }

  // 🎯 콘솔 로그 추가 (복합결제 시 결제예정 금액 계산 포함)
  console.log(`🎯 Total Calculation: ${admissionFee} + ${rentalPrice} + ${lockerPrice} + ${membershipFee} - ${discount} = ${total}`);
  console.log(`💳 Combined Payment: ${combinedPaymentRadio && combinedPaymentRadio.checked ? combinedPaymentTotal.toLocaleString('ko-KR') : 'N/A'}`);
  console.log(`📝 Unpaid Amount: ${unpaidAmount.toLocaleString('ko-KR')} 원`);
}


document.addEventListener('DOMContentLoaded', function() {
  const membershipSelect = document.getElementById('membership');
  const rentalMonthsSelect = document.getElementById('rental_months');
  const lockerMonthsSelect = document.getElementById('locker_months');
  const membershipMonthsSelect = document.getElementById('membership_months');
  const discountInput = document.getElementById('discount');

  membershipSelect.addEventListener('change', updateAdmissionFee);
  rentalMonthsSelect.addEventListener('change', () => updateRentalPrice(rentalMonthsSelect));
  lockerMonthsSelect.addEventListener('change', () => updateLockerPrice(lockerMonthsSelect));
  membershipMonthsSelect.addEventListener('change', () => updateMembershipFee(membershipMonthsSelect));
  //Event Listener for Discount Input
  discountInput.addEventListener('input', calculateTotal);

  calculateTotal(); // Initial calculation

});

function getCombinedPaymentTotal() {
  const paymentItems = document.querySelectorAll('#payment-items input');
  let total = 0;
  paymentItems.forEach((input, index) => {
    if (index % 2 === 0) {
      const amount = paymentItems[index + 1]?.value || '0';
      if (amount) {
        const numAmount = parseInt(amount.replace(/[^\d]/g, '')) || 0;
        total += numAmount;
      }
    }
  });
  return total;
}