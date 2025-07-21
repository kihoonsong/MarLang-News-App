# Firebase Storage 보안 규칙 임시 완화 방법

## 현재 문제
- super_admin 사용자가 이미지 업로드 시 권한 오류 발생
- Firebase Storage 보안 규칙이 사용자 역할을 제대로 인식하지 못함

## 임시 해결책: Firebase 콘솔에서 Storage 규칙 수정

Firebase 콘솔 > Storage > Rules 탭에서 다음 규칙으로 임시 변경:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 임시로 모든 인증된 사용자에게 읽기/쓰기 권한 부여
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 또는 더 안전한 임시 규칙:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 읽기는 모든 사용자 허용
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // 쓰기는 인증된 사용자만 허용 (역할 확인 제거)
    match /articles/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    match /announcements/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    match /users/{userId}/{allPaths=**} {
      allow write: if request.auth != null && 
        (request.auth.uid == userId || request.auth != null);
    }
  }
}
```

## 영구 해결책: 커스텀 클레임 사용

Firebase Functions에서 사용자 역할을 커스텀 클레임으로 설정:

```javascript
// functions/index.js에 추가
exports.setUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
  }
  
  const { userId, role } = data;
  
  // 관리자만 실행 가능하도록 체크
  const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || !['admin', 'super_admin'].includes(callerDoc.data().role)) {
    throw new functions.https.HttpsError('permission-denied', '권한이 없습니다.');
  }
  
  // 커스텀 클레임 설정
  await admin.auth().setCustomUserClaims(userId, { role: role });
  
  return { success: true };
});
```

그리고 Storage 규칙에서 커스텀 클레임 사용:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'super_admin');
    }
    
    match /{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## 권장 조치 순서

1. **즉시**: 임시 규칙으로 변경하여 이미지 업로드 기능 복구
2. **단기**: 커스텀 클레임 함수 구현 및 배포
3. **장기**: 영구 보안 규칙 적용 및 테스트

## 주의사항

- 임시 규칙은 보안이 약화되므로 빠른 시일 내에 영구 해결책 적용 필요
- 커스텀 클레임 설정 후 사용자는 재로그인 필요
- 규칙 변경 후 몇 분간 전파 시간 필요