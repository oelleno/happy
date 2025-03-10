
// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-storage.js";

// Firebase 설정 - 환경 변수 없이 직접 구성
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
export const db = getFirestore(app);
export const storage = getStorage(app);

// 가입 완료 버튼 클릭 시 실행될 함수
async function submitForm() {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData();
            const name = document.getElementById('name').value.trim();
            const contact = document.getElementById('contact').value.trim();
            const birthdate = document.getElementById('birthdate').value.trim();
            const address = document.getElementById('main_address').value.trim();
            const membership = document.getElementById('membership').value.trim();
            const isAdmin = localStorage.getItem("adminVerified"); // 관리자 인증 여부 확인

            if (!name || !contact) {
                reject(new Error("이름과 연락처를 입력하세요."));
                return;
            }

            const rentalMonths = document.getElementById('rental_months').value.trim();
            const lockerMonths = document.getElementById('locker_months').value.trim();
            const membershipMonths = document.getElementById('membership_months').value.trim();
            const discount = document.getElementById('discount').value.trim();
            const totalAmount = document.getElementById('total_amount').value.trim();

            // 현재 날짜 (YYMMDD 포맷)
            const now = new Date();
            const dateStr = now.getFullYear().toString().slice(2) +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0');

            // Get today's documents only
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            const querySnapshot = await getDocs(collection(db, "Membership"));
            let todayDocs = 0;
            querySnapshot.forEach(doc => {
                const docDate = new Date(doc.data().timestamp);
                if (docDate >= startOfDay && docDate <= endOfDay) {
                    todayDocs++;
                }
            });

            const dailyNumber = (todayDocs + 1).toString().padStart(3, '0'); // 3자리 번호

            // Store the document number for image upload
            localStorage.setItem('current_doc_number', dailyNumber);

            // 생성된 docId를 전역 변수에 저장
            window.docId = `${dateStr}_${dailyNumber}_${name}`;
            console.log("🚀 생성된 Doc ID:", window.docId);

            // 저장할 데이터
            const userData = {
                docId: window.docId,
                name: name,
                contact: contact,
                birthdate: birthdate,
                address: address,
                membership: membership,
                branch: document.getElementById('branch').value,
                contract_manager: document.querySelector('input[name="contract_manager"]').value,
                gender: document.querySelector('input[name="gender"]:checked')?.value || '',
                rental_months: rentalMonths,
                rental_price: document.getElementById('rental_price').value,
                locker_months: lockerMonths,
                locker_price: document.getElementById('locker_price').value,
                membership_months: membershipMonths,
                membership_fee: document.getElementById('membership_fee').value,
                admission_fee: document.getElementById('admission_fee').value,
                discount: discount,
                totalAmount: totalAmount,
                goals: Array.from(document.querySelectorAll('input[name="goal"]:checked')).map(cb => cb.value),
                other_goal: document.getElementById('other').value,
                workout_times: {
                    start: document.querySelector('select[name="morning_hour"]').value,
                    end: document.querySelector('select[name="afternoon_hour"]').value,
                    additional: document.querySelector('.time-input[type="text"]').value
                },
                payment_method: document.querySelector('input[name="payment"]:checked')?.value || '',
                payment_details: Array.from(document.querySelectorAll('#payment-items input')).reduce((acc, input, i) => {
                    if (i % 2 === 0) {
                        acc.push({
                            description: input.value,
                            amount: document.querySelectorAll('#payment-items input')[i + 1]?.value || ''
                        });
                    }
                    return acc;
                }, []),
                cash_receipt: document.querySelector('input[name="cash_receipt"]:checked')?.value || '',
                receipt_phone: document.getElementById('receipt_phone').value,
                membership_start_date: document.getElementById('membership_start_date').value,
                referral_sources: Array.from(document.querySelectorAll('input[name="referral"]:checked')).map(cb => ({
                    source: cb.value,
                    detail: cb.value === 'SNS' ? document.getElementById('snsField').value :
                        cb.value === '인터넷검색' ? document.querySelector('input[name="internet_detail"]').value :
                            cb.value === '지인추천' ? document.querySelector('input[name="referral_name"]').value : ''
                })),
                terms_agreed: {
                    main: document.querySelector('input[name="terms_agree"]').checked,
                    twentyfour_hour: document.querySelector('input[name="24h_terms_agree"]').checked,
                    refund: document.querySelector('input[name="refund_terms_agree"]').checked
                },
                timestamp: new Date().toISOString(),
                unpaid: document.getElementById('unpaid').value,
                adminVerified: isAdmin ? true : false // 🔹 관리자 인증 여부 추가
            };

            // Firestore에 저장
            await setDoc(doc(db, "Membership", window.docId), userData);
            resolve();
        } catch (error) {
            console.error("회원 정보 저장 중 오류 발생:", error);
            alert("회원 정보 저장에 실패했습니다.");
            reject(error);
        }
    });
}


// Firebase Storage에 업로드
// HTML에서 호출할 수 있도록 전역 함수로 설정
async function uploadImage(fileName, blob) {
    try {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/11.3.0/firebase-storage.js");
        const { getFirestore, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js");

        const storage = getStorage(); // Firebase Storage 인스턴스 가져오기
        const db = getFirestore(); // Firestore 인스턴스 가져오기

        // 🔹 Firebase Storage 경로 설정 및 업로드
        const storageRef = ref(storage, `Membership/${window.docId}/${fileName}`);
        await uploadBytes(storageRef, blob);
        console.log("✅ Firebase Storage 업로드 완료!");

        // 🔹 업로드된 파일의 다운로드 URL 가져오기
        const downloadURL = await getDownloadURL(storageRef);
        console.log("🔗 Firebase Storage 이미지 URL:", downloadURL);

        // 🔹 Firestore에 URL 저장 (window.docId 사용)
        if (window.docId) {
            const docRef = doc(db, "Membership", window.docId);
            await updateDoc(docRef, { imageUrl: downloadURL });
            console.log("✅ Firestore에 이미지 URL 저장 완료:", downloadURL);
        } else {
            console.error("❌ Firestore 문서 ID(window.docId)가 제공되지 않음.");
        }

        return downloadURL; // Firebase Storage URL 반환 (프론트엔드에서 활용 가능)
    } catch (error) {
        console.error("❌ Firebase Storage 업로드 실패:", error);
        throw error;
    }
}


window.submitForm = submitForm;
window.uploadImage = uploadImage;
