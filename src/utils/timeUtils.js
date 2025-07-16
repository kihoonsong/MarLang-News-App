// 한국 시간 처리 유틸리티

/**
 * 한국 시간(KST, UTC+9) 기준으로 현재 시간을 반환
 * @returns {Date} 한국 시간 기준 현재 시간
 */
export const getKoreanTime = () => {
  const now = new Date();
  // 한국 시간은 UTC+9 (540분)
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreanTime;
};

/**
 * 한국 시간 기준으로 ISO 문자열 반환
 * @returns {string} 한국 시간 기준 ISO 문자열
 */
export const getKoreanTimeISOString = () => {
  return getKoreanTime().toISOString();
};

/**
 * 로컬 시간 입력을 UTC ISO 문자열로 변환 (예약 발행용)
 * @param {string} localTimeString - 로컬 시간 문자열 (YYYY-MM-DDTHH:mm 형식)
 * @returns {string} UTC 기준 ISO 문자열
 */
export const convertLocalToKoreanISO = (localTimeString) => {
  console.log('🕐 시간 변환 시작:', localTimeString);
  
  // 사용자 입력을 한국 시간으로 해석하여 UTC로 변환
  // 방법: 입력값에 한국 시간대 정보를 명시적으로 추가
  const koreanTimeString = localTimeString + ':00+09:00'; // KST 시간대 추가
  const koreanDate = new Date(koreanTimeString);
  
  console.log('📅 한국시간으로 해석:', koreanDate.toString());
  
  // 이미 UTC로 변환된 상태
  const utcISO = koreanDate.toISOString();
  
  console.log('🌍 변환된 UTC 시간:', utcISO);
  console.log('🇰🇷 확인용 한국시간:', new Date(utcISO).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
  
  return utcISO;
};

/**
 * 한국 시간 기준으로 두 시간을 비교
 * @param {string} timeString1 - 첫 번째 시간 문자열
 * @param {string} timeString2 - 두 번째 시간 문자열
 * @returns {number} 비교 결과 (-1: time1이 이전, 0: 같음, 1: time1이 이후)
 */
export const compareKoreanTime = (timeString1, timeString2) => {
  const time1 = new Date(timeString1);
  const time2 = new Date(timeString2);
  
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
};

/**
 * UTC 기준으로 현재 시간이 지정된 시간 이후인지 확인 (예약 발행용)
 * @param {string} targetTimeString - 대상 시간 문자열 (UTC)
 * @returns {boolean} 현재 시간이 대상 시간 이후인지 여부
 */
export const isAfterKoreanTime = (targetTimeString) => {
  const nowUTC = new Date(); // 현재 UTC 시간
  const targetTimeUTC = new Date(targetTimeString); // DB에 저장된 UTC 시간
  
  console.log('⏰ 시간 비교:', {
    현재UTC: nowUTC.toISOString(),
    대상UTC: targetTimeUTC.toISOString(),
    현재KST: nowUTC.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    대상KST: targetTimeUTC.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    결과: nowUTC >= targetTimeUTC
  });
  
  return nowUTC >= targetTimeUTC;
};

/**
 * 한국 시간 기준으로 시간 문자열을 포맷팅
 * @param {string} timeString - 시간 문자열
 * @returns {string} 포맷된 한국 시간 문자열
 */
export const formatKoreanTime = (timeString) => {
  const date = new Date(timeString);
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 한국 시간 기준으로 datetime-local input에 사용할 값 생성
 * @param {Date|string} dateInput - 날짜 입력 (선택사항, 기본값: 현재 시간)
 * @returns {string} datetime-local input에 사용할 값
 */
export const getKoreanDateTimeLocalValue = (dateInput = null) => {
  let koreanTime;
  
  if (dateInput) {
    // DB에서 가져온 UTC 시간을 한국 시간으로 변환
    const utcDate = new Date(dateInput);
    koreanTime = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  } else {
    // 현재 한국 시간 사용
    koreanTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  }
  
  console.log('🕐 datetime-local 값 생성:', {
    입력: dateInput,
    한국시간: koreanTime.toString(),
    결과: `${koreanTime.getFullYear()}-${String(koreanTime.getMonth() + 1).padStart(2, '0')}-${String(koreanTime.getDate()).padStart(2, '0')}T${String(koreanTime.getHours()).padStart(2, '0')}:${String(koreanTime.getMinutes()).padStart(2, '0')}`
  });
  
  // 한국 시간 기준으로 YYYY-MM-DDTHH:mm 형식 생성
  const year = koreanTime.getFullYear();
  const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getDate()).padStart(2, '0');
  const hours = String(koreanTime.getHours()).padStart(2, '0');
  const minutes = String(koreanTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};