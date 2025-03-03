// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAyP5QTMzBtz8lMEzkE4C66CjFbZ3a17QM",
  authDomain: "bodystar-1b77d.firebaseapp.com",
  projectId: "bodystar-1b77d",
  storageBucket: "bodystar-1b77d.firebasestorage.app",
  messagingSenderId: "1011822927832",
  appId: "1:1011822927832:web:87f0d859b3baf1d8e21cad"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 엑셀 파일명 설정
const fileName = "contract.xlsx";


// 버튼 클릭 시 실행되는 함수
export async function excelupload() {
  const uploadBtn = document.getElementById("excel-upload-btn");
  uploadBtn.textContent = "최종업로드중...";
  uploadBtn.disabled = true;

  try {
    // Firestore에서 특정 문서 가져오기
    const docRef = doc(db, "회원가입계약서", docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("문서를 찾을 수 없습니다:", docId);
      document.getElementById("status").innerText = "문서를 찾을 수 없습니다!";
      return;
    }
    // Firestore에서 가져온 데이터 매핑
    const userData = docSnap.data();

    // receipts 배열이 존재하는지 확인
    if (userData.receipts && userData.receipts.length > 0) {
      userData.receipts.forEach((receipt, index) => {
        console.log(`영수증 ${index + 1} URL:`, receipt.url);
      });
    } else {
      console.warn("영수증 URL이 없습니다.");
    }
    const newData = [[
      userData.docId || "N/A",
      userData.branch || "N/A",
      userData.contract_manager || "N/A",
      userData.name || "N/A",
      userData.contact || "N/A",
      userData.gender || "N/A",
      userData.birthdate || "N/A",
      userData.address || "N/A",
      userData.membership || "N/A",
      userData.rental_months || "N/A",
      userData.locker_months || "N/A",
      userData.membership_months || "N/A",
      userData.discount || "N/A",
      userData.totalAmount || "N/A",
      userData.payment_method || "N/A",
      userData.unpaid ? userData.unpaid.replace('결제예정 ', '') : "N/A",
      userData.goals ? userData.goals.join(", ") : "N/A",
      userData.other_goal || "N/A",
      userData.workout_times ? `${userData.workout_times.start}-${userData.workout_times.end} ${userData.workout_times.additional || ''}` : "N/A",
      userData.referral_sources ? userData.referral_sources.map(ref =>
        ref.source + (ref.detail ? `: ${typeof ref.detail === 'object' ? `${ref.detail.name}(${ref.detail.phone})` : ref.detail}` : '')
      ).join(', ') : "N/A",
      userData.membership_start_date || "N/A",
      userData.timestamp || "N/A",
      userData.imageUrl || "",
      userData.receipts?.[0]?.url || "",
      userData.receipts?.[1]?.url || "",
      userData.receipts?.[2]?.url || "",
      userData.receipts?.[3]?.url || "",
      userData.receipts?.[4]?.url || "",
      userData.receipts?.[5]?.url || ""
    ]];


    // 기존 엑셀 파일 가져오기
    let workbook;
    let existingData = [];
    const sheetName = "회원가입계약서";
    const headerRow = [
      "ID", "지점", "계약담당자", "이름", "연락처", "성별",
      "생년월일", "주소", "회원권", "운동복대여", "라커대여",
      "기간", "할인", "합계", "결제방법", "결제예정",
      "운동목적", "기타목적", "운동시간", "가입경로", "시작일",
      "등록일시", "계약서사본", "영수증1", "영수증2", "영수증3", "영수증4", "영수증5", "영수증6"
    ];

    try {
      const encodedFileName = encodeURIComponent(fileName);
      const fileRef = ref(storage, encodedFileName);
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      const data = await response.arrayBuffer();

      // 기존 엑셀 파일 읽기
      workbook = XLSX.read(data, { type: "array" });

      // "회원가입" 시트가 있으면 데이터를 유지
      if (workbook.SheetNames.includes(sheetName)) {
        const worksheet = workbook.Sheets[sheetName];
        existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

    } catch (error) {
      console.warn("기존 엑셀 파일 없음. 새 파일 생성.");
      workbook = XLSX.utils.book_new();
    }

    // 기존 데이터가 없으면 헤더 추가
    if (existingData.length === 0) {
      existingData.push(headerRow);
    } else {
      // 빈 행 제거
      existingData = existingData.filter(row => row.some(cell => cell !== undefined && cell !== ""));
    }

    // 기존 데이터의 마지막 행에 새로운 데이터 추가
    existingData.push(...newData);

    // 새 엑셀 워크시트 생성
    const newWorksheet = XLSX.utils.aoa_to_sheet(existingData, { cellDates: true });
    // Enable hyperlinks in the worksheet
    if (!newWorksheet['!cols']) newWorksheet['!cols'] = [];
    for (let i = 22; i <= 28; i++) {
      newWorksheet['!cols'][i] = { wch: 15 }; // Set column width for hyperlink columns
    }

    // 기존 시트를 유지하면서 "회원가입" 시트를 추가하거나 덮어쓰기
    if (workbook.SheetNames.includes(sheetName)) {
      workbook.Sheets[sheetName] = newWorksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, sheetName);
    }

    // 엑셀 파일을 Blob으로 변환 후 업로드
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const fileRef = ref(storage, fileName);
    await uploadBytesResumable(fileRef, blob);

    const uploadBtn = document.getElementById("excel-upload-btn");
    uploadBtn.textContent = "최종업로드완료!";
    uploadBtn.disabled = true;
    console.log("✅ 엑셀 업데이트가 성공적으로 완료되었습니다!");
  } catch (error) {
    console.error("엑셀 업데이트 오류:", error);
    document.getElementById("status").innerText = "엑셀 업데이트 실패!";
  }
};