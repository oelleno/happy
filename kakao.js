
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";
import { db } from "./firebase.js";

// 공통 상수 선언
const API_KEY = 'lcrmiph2rvyuaqiq1qp3lbs332di0x95';
const USER_ID = 'bodystar';
const SENDER_KEY = 'b4c886fa9bd3cbf1faddb759fa6532867844ef03';
const SENDER_PHONE = '01092792273';
const COMPANY_NAME = '바디스타';
const MANAGER_PHONE = '01086871992';  // 매니저 알람톡 수신 전화번호

// 카카오 알림톡 API 호출 함수
async function sendKakaoAlimtalk(params) {
  try {
    console.log("API 요청 전송 중...");

    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const result = await response.json();
    console.log('카카오 알림톡 전송 결과:', result);

    if (result.code === 0 && result.message === '성공적으로 전송요청 하였습니다.') {
      console.log('알림톡 전송 성공!');
      window.dispatchEvent(new Event('kakaoSendSuccess'));
      return true;
    } else {
      console.error('알림톡 전송 실패 - API 응답:', result);
      throw new Error('알림톡 전송 실패: ' + (result.message || '알 수 없는 오류'));
    }
  } catch (error) {
    console.error('카카오 API 요청 오류:', error);
    throw error;
  }
}

// 전화번호 인증번호 발송
async function sendVerificationCode() {
  const phone = document.getElementById('phone').value;
  if (!phone) return;

  const authCode = Math.floor(100000 + Math.random() * 900000);

  const params = new URLSearchParams({
    'apikey': API_KEY,
    'userid': USER_ID,
    'senderkey': SENDER_KEY,
    'tpl_code': 'TY_3472',
    'sender': SENDER_PHONE,
    'receiver_1': phone,
    'subject_1': '인증번호발송',
    'message_1': `[${COMPANY_NAME}] 본인 확인을 위한 인증번호는 ${authCode}입니다.`,
  });

  try {
    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    if (data.result_code === "1" || data.message === "성공적으로 전송요청 하였습니다.") {
      document.getElementById('verification-code-section').style.display = 'block';
      document.getElementById('phone-section').style.display = 'none';
      document.getElementById('admin-button').style.display = 'none';
      window.authCode = authCode;
      alert("인증번호가 발송되었습니다.");
    } else {
      alert(`인증번호 전송 실패: ${data.message}`);
    }
  } catch (error) {
    console.error('인증번호 전송 오류:', error);
    alert('인증번호 전송 실패');
  }
}

// Firestore에서 계약서 데이터 가져오기
async function getContractData() {
  if (!window.docId) {
    throw new Error('계약서 번호(docId)가 없습니다.');
  }

  const docRef = doc(db, "회원가입계약서", window.docId);
  const docSnap = await getDoc(docRef).catch(err => {
    console.error("Firestore getDoc 오류:", err);
    throw new Error('계약서 정보 조회 중 오류가 발생했습니다.');
  });

  if (!docSnap.exists()) {
    throw new Error('계약서를 찾을 수 없습니다. docId: ' + window.docId);
  }

  const userData = docSnap.data();
  console.log("사용자 데이터 조회 성공:", userData.name);

  // imageUrl이 Firestore에 저장되기 전이면 실행 중지
  if (!userData.imageUrl) {
    throw new Error('계약서 이미지가 아직 업로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
  }

  if (!userData.contact) {
    throw new Error('연락처 정보가 없습니다.');
  }

  return userData;
}

// 매니저 알림톡 (계약서 도착 알림)
async function sendKakaoManager() {
  try {
    const userData = await getContractData();
    const customerName = userData.name;
    const contractUrl = userData.imageUrl.replace('https://', '');

    const params = new URLSearchParams({
      'apikey': API_KEY,
      'userid': USER_ID,
      'senderkey': SENDER_KEY,
      'tpl_code': 'TY_1680',
      'sender': SENDER_PHONE,
      'receiver_1': MANAGER_PHONE,
      'subject_1': '계약서',
      'message_1': `[매니저알림]\n안녕하세요. ${customerName}님!\n${COMPANY_NAME}에 등록해주셔서 진심으로 감사드립니다!`,
      'button_1': JSON.stringify({
        "button": [
          { "name": "채널추가", "linkType": "AC", "linkTypeName": "채널 추가" },
          {
            "name": "계약서 바로가기",
            "linkType": "WL",
            "linkTypeName": "웹링크",
            "linkPc": `https://${contractUrl}`,
            "linkMo": `https://${contractUrl}`
          }
        ]
      }),
      'failover': 'N'
    });

    await sendKakaoAlimtalk(params);
    console.log('매니저 알림이 전송되었습니다.');
    return true;
  } catch (error) {
    console.error('매니저 알림톡 전송 실패:', error);
    throw error;
  }
}

export { sendVerificationCode, sendKakaoManager};
