import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const DebugPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [firestoreUser, setFirestoreUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFirestoreData = async () => {
    if (!user || !user.id) {
      setError('먼저 로그인해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setFirestoreUser(null);

    try {
      const userDocRef = doc(db, 'users', user.id);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setFirestoreUser(docSnap.data());
      } else {
        setError('Firestore에 해당 사용자 문서가 존재하지 않습니다.');
      }
    } catch (e) {
      console.error("Firestore 데이터 조회 오류:", e);
      setError(`Firestore 데이터 조회 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>인증 정보를 불러오는 중입니다...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔍 관리자 데이터 디버깅 페이지
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          이 페이지는 현재 로그인된 관리자의 프론트엔드 상태와 실제 Firestore 데이터베이스 상태를 비교하여 권한 문제를 진단합니다.
        </Typography>

        <Button variant="contained" onClick={fetchFirestoreData} disabled={loading || !user}>
          {loading ? <CircularProgress size={24} /> : 'Firestore 데이터 조회'}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {/* 프론트엔드 상태 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>1. 프론트엔드 상태 (AuthContext)</Typography>
            <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto', height: '300px' }}>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </Paper>
          </Box>

          {/* Firestore 데이터베이스 상태 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>2. Firestore 데이터베이스 상태</Typography>
            <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto', height: '300px' }}>
              {firestoreUser ? (
                <pre>{JSON.stringify(firestoreUser, null, 2)}</pre>
              ) : (
                <Typography color="text.secondary">조회 버튼을 눌러주세요.</Typography>
              )}
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>진단 결과</Typography>
          {user && firestoreUser ? (
            (user.role === firestoreUser.role) && (firestoreUser.role === 'admin' || firestoreUser.role === 'super_admin') ? (
              <Alert severity="success">
                진단 완료: 프론트엔드와 Firestore의 역할(role) 정보가 'admin' 또는 'super_admin'으로 일치합니다. 권한 문제가 없어야 정상입니다.
              </Alert>
            ) : (
              <Alert severity="error">
                진단 완료: 프론트엔드와 Firestore의 역할 정보가 일치하지 않거나, 관리자 역할이 아닙니다. 이것이 권한 문제의 원인입니다.
              </Alert>
            )
          ) : (
            <Alert severity="info">
              Firestore 데이터를 조회하여 진단 결과를 확인하세요.
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DebugPage;