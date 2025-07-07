  // 단순화된 TTS 시작 함수
  const startTTS = async () => {
    if (!articleData) {
      console.error('❌ 기사 데이터 없음');
      return;
    }

    setIsTTSLoading(true);
    console.log('🎵 Simple TTS 시작');

    // 컨트롤러 확인/생성
    if (!ttsController || !ttsController.isRunning()) {
      const newController = createSimpleTTSController();
      setTtsController(newController);
      setTimeout(() => startTTS(), 50);
      return;
    }

    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    
    if (currentContent.trim().length === 0) {
      console.warn('⚠️ 재생할 콘텐츠가 없습니다.');
      setIsTTSLoading(false);
      return;
    }

    try {
      const result = await playSimpleTTS(currentContent, {
        rate: ttsSpeed,
        volume: 1.0,
        pitch: 1.0,
        controller: ttsController
      }, {
        onStart: () => {
          console.log('✅ TTS 시작 성공');
          setIsTTSLoading(false);
          setIsTTSPlaying(true);
          setCurrentSentence(0);
        },
        onProgress: (currentIndex, totalSentences) => {
          setCurrentSentence(currentIndex);
        },
        onComplete: () => {
          console.log('✅ TTS 재생 완료');
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
        },
        onError: (error) => {
          console.error('❌ TTS 에러:', error);
          setIsTTSLoading(false);
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
        }
      });

      if (!result) {
        console.error('❌ TTS 시작 실패');
        setIsTTSLoading(false);
        setIsTTSPlaying(false);
      }

    } catch (error) {
      console.error('❌ TTS 시작 실패:', error);
      setIsTTSLoading(false);
      setIsTTSPlaying(false);
      setCurrentSentence(-1);
    }
  };