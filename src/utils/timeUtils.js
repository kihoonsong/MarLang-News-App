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
 * 로컬 시간 입력을 한국 시간 기준 ISO 문자열로 변환
 * @param {string} localTimeString - 로컬 시간 문자열 (YYYY-MM-DDTHH:mm 형식)
 * @returns {string} 한국 시간 기준 ISO 문자열
 */
export const convertLocalToKoreanISO = (localTimeString) => {
  // 입력된 시간을 한국 시간으로 간주
  const localDate = new Date(localTimeString);
  
  // 사용자가 입력한 시간이 한국 시간이라고 가정하고
  // 이를 UTC로 변환하여 저장 (한국 시간 - 9시간 = UTC)
  const utcTime = new Date(localDate.getTime() - (9 * 60 * 60 * 1000));
  
  return utcTime.toISOString();
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
 * 한국 시간 기준으로 현재 시간이 지정된 시간 이후인지 확인
 * @param {string} targetTimeString - 대상 시간 문자열
 * @returns {boolean} 현재 시간이 대상 시간 이후인지 여부
 */
export const isAfterKoreanTime = (targetTimeString) => {
  const now = getKoreanTime();
  const targetTime = new Date(targetTimeString);
  return now >= targetTime;
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
  let date;
  
  if (dateInput) {
    // DB에서 가져온 UTC 시간을 한국 시간으로 변환
    date = new Date(dateInput);
    date = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  } else {
    // 현재 한국 시간 사용
    date = getKoreanTime();
  }
  
  // 한국 시간 기준으로 YYYY-MM-DDTHH:mm 형식 생성
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};