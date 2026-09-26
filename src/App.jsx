import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import Toolbar from './components/Toolbar';
import FlashCard from './components/FlashCard';
import AuthModal from './components/AuthModal';
import CardListModal from './components/CardListModal';
import QuizModal from './components/QuizModal';
import AddEditCardModal from './components/AddEditCardModal';
import Toast from './components/Toast';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('toeic_theme') || 'light');
  const [cards, setCards] = useState([]);
  const [learnedCardIds, setLearnedCardIds] = useState([]);
  const [user, setUser] = useState(null);
  const [dbOnline, setDbOnline] = useState(false);

  const [mode, setMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('toeic_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    loadCards();
    checkAuthSession();
  }, []);

  const loadCards = async () => {
    try {
      const token = localStorage.getItem('toeic_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/cards', { headers });
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        setDbOnline(true);
      } else {
        throw new Error('API server error');
      }
    } catch (err) {
      console.warn('Backend server note:', err.message);
      setDbOnline(false);
    }
  };

  const checkAuthSession = async () => {
    const token = localStorage.getItem('toeic_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchUserProgress(token);
        loadCards(); // Reload cards to include user's custom words
      } else {
        localStorage.removeItem('toeic_token');
      }
    } catch (err) {
      console.error('Check auth error:', err);
    }
  };

  const fetchUserProgress = async (token) => {
    try {
      const res = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('toeic_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLearnedCardIds(data.learnedCardIds || []);
      }
    } catch (err) {
      console.error('Fetch progress error:', err);
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const isLearned = learnedCardIds.includes(c.cardId);
      if (mode === 'learned' && !isLearned) return false;
      if (mode === 'unlearned' && isLearned) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchWord = c.word.toLowerCase().includes(q);
        const matchMeaning = c.meanings && c.meanings.some((m) => m.text.toLowerCase().includes(q));
        return matchWord || matchMeaning;
      }
      return true;
    });
  }, [cards, learnedCardIds, mode, searchQuery]);

  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
  }, [filteredCards, currentIndex]);

  const currentCard = filteredCards[currentIndex];

  useEffect(() => {
    if (autoSpeak && currentCard && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentIndex, autoSpeak, currentCard]);

  useEffect(() => {
    if (!isAutoPlay || filteredCards.length === 0) return;

    const timer = setInterval(() => {
      setIsFlipped((prevFlipped) => {
        if (!prevFlipped) {
          return true;
        } else {
          setCurrentIndex((prevIdx) => (prevIdx < filteredCards.length - 1 ? prevIdx + 1 : 0));
          return false;
        }
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isAutoPlay, filteredCards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
  }, [filteredCards.length]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
  }, [filteredCards.length]);

  const handleMarkLearned = async (learned) => {
    if (!currentCard) return;
    const cardId = currentCard.cardId;

    setLearnedCardIds((prev) => {
      if (learned) {
        return prev.includes(cardId) ? prev : [...prev, cardId];
      } else {
        return prev.filter((id) => id !== cardId);
      }
    });

    showToast(learned ? '✓ Đã thuộc' : '✗ Chưa thuộc');

    const token = localStorage.getItem('toeic_token');
    if (token) {
      try {
        await fetch('/api/progress/mark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cardId, learned })
        });
      } catch (e) {}
    }

    handleNext();
  };

  const handleShuffle = () => {
    setCards((prev) => [...prev].sort(() => 0.5 - Math.random()));
    setCurrentIndex(0);
    setIsFlipped(false);
    showToast('🔀 Đã trộn ngẫu nhiên!');
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      learnedCardIds,
      cardsCount: cards.length,
      cards
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `toeic_flashcards_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 Đã tải file sao lưu JSON về máy!');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported.cards)) {
          setCards(imported.cards);
        }
        if (Array.isArray(imported.learnedCardIds)) {
          setLearnedCardIds(imported.learnedCardIds);
        }
        showToast('⬆️ Đã phục hồi dữ liệu từ file thành công!');
      } catch (err) {
        showToast('❌ File JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCard = async (cardData) => {
    const token = localStorage.getItem('toeic_token');

    try {
      if (cardData.cardId) {
        const res = await fetch(`/api/cards/${cardData.cardId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(cardData)
        });
        if (res.ok) {
          showToast('💾 Cập nhật từ thành công!');
          loadCards();
        }
      } else {
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(cardData)
        });

        if (res.ok) {
          const data = await res.json();
          showToast(data.message || '✨ Đã lưu từ vào DB!');
          loadCards();
        } else {
          setCards((prev) => {
            const cleanWord = cardData.word.trim().toLowerCase();
            const existingIdx = prev.findIndex((c) => c.word.toLowerCase() === cleanWord);
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx].meanings.push({ text: cardData.meaning, type: '', phonetic: '' });
              showToast(`➕ Đã gộp 1 nghĩa mới vào từ "${updated[existingIdx].word}"!`);
              return updated;
            } else {
              const maxId = prev.reduce((acc, c) => Math.max(acc, c.cardId || 0), 0);
              showToast(`✨ Đã thêm từ mới "${cardData.word}"!`);
              return [{ cardId: maxId + 1, word: cardData.word, meanings: [{ text: cardData.meaning, type: '', phonetic: '' }] }, ...prev];
            }
          });
        }
      }
    } catch (err) {
      setCards((prev) => {
        const cleanWord = cardData.word.trim().toLowerCase();
        const existingIdx = prev.findIndex((c) => c.word.toLowerCase() === cleanWord);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx].meanings.push({ text: cardData.meaning, type: '', phonetic: '' });
          showToast(`➕ Đã gộp 1 nghĩa mới vào từ "${updated[existingIdx].word}"!`);
          return updated;
        } else {
          const maxId = prev.reduce((acc, c) => Math.max(acc, c.cardId || 0), 0);
          showToast(`✨ Đã thêm từ mới "${cardData.word}"!`);
          return [{ cardId: maxId + 1, word: cardData.word, meanings: [{ text: cardData.meaning, type: '', phonetic: '' }] }, ...prev];
        }
      });
    }
  };

  const handleDeleteCard = async (cardId) => {
    const token = localStorage.getItem('toeic_token');
    if (!token) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản để xoá từ!');
      setIsAuthOpen(true);
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xoá thẻ này khỏi MongoDB?')) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('🗑️ Đã xoá thẻ!');
        loadCards();
      }
    } catch (err) {
      showToast('❌ Không thể xoá thẻ.');
    }
  };

  const handleSaveQuizScore = async (score, total) => {
    const token = localStorage.getItem('toeic_token');
    if (token) {
      try {
        await fetch('/api/progress/quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ score, total })
        });
      } catch (e) {}
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAuthOpen || isReviewOpen || isQuizOpen || isAddEditOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleMarkLearned(false);
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        handleMarkLearned(true);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentCard && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(currentCard.word);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, currentCard, isAuthOpen, isReviewOpen, isQuizOpen, isAddEditOpen]);

  const totalCardsCount = cards.length;
  const learnedCardsCount = cards.filter((c) => learnedCardIds.includes(c.cardId)).length;
  const remainCardsCount = totalCardsCount - learnedCardsCount;
  const masteryPct = totalCardsCount > 0 ? Math.round((learnedCardsCount / totalCardsCount) * 100) : 0;

  return (
    <div className="app">
      <Header
        user={user}
        dbOnline={dbOnline}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdd={() => {
          setCardToEdit(null);
          setIsAddEditOpen(true);
        }}
        onLogout={() => {
          localStorage.removeItem('toeic_token');
          setUser(null);
          setLearnedCardIds([]);
          loadCards();
          showToast('👋 Đã đăng xuất');
        }}
      />

      <StatsOverview
        total={totalCardsCount}
        learned={learnedCardsCount}
        remain={remainCardsCount}
        masteryPct={masteryPct}
      />

      <Toolbar
        mode={mode}
        setMode={setMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onShuffle={handleShuffle}
        onOpenQuiz={() => setIsQuizOpen(true)}
        autoSpeak={autoSpeak}
        setAutoSpeak={setAutoSpeak}
        isAutoPlay={isAutoPlay}
        setIsAutoPlay={setIsAutoPlay}
        onExportData={handleExportJSON}
        onImportData={() => fileInputRef.current?.click()}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportJSON}
      />

      <FlashCard
        card={currentCard}
        currentIndex={currentIndex}
        totalFiltered={filteredCards.length}
        isLearned={currentCard ? learnedCardIds.includes(currentCard.cardId) : false}
        isFlipped={isFlipped}
        setIsFlipped={setIsFlipped}
        onPrev={handlePrev}
        onNext={handleNext}
        onMark={handleMarkLearned}
        onEdit={(card) => {
          setCardToEdit(card);
          setIsAddEditOpen(true);
        }}
        isAutoPlay={isAutoPlay}
      />

      <div className="bottomGrid">
        <div className="bottom">
          <div>
            <b>📋 Quản lý</b>
            <div className="note">Xem, sửa, gộp hoặc xoá flashcard.</div>
          </div>
          <button className="primary" onClick={() => setIsReviewOpen(true)}>Mở</button>
        </div>
        <div className="bottom">
          <div>
            <b>📝 Trắc nghiệm</b>
            <div className="note">Kiểm tra nhanh 10 từ ngẫu nhiên.</div>
          </div>
          <button className="primary" onClick={() => setIsQuizOpen(true)}>Bắt đầu</button>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData) => {
          setUser(userData);
          fetchUserProgress();
          loadCards();
        }}
        showToast={showToast}
      />

      <CardListModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        cards={cards}
        learnedCardIds={learnedCardIds}
        onToggleLearned={(id) => {
          const isLearned = learnedCardIds.includes(id);
          const nextState = !isLearned;
          setLearnedCardIds((prev) => (nextState ? [...prev, id] : prev.filter((x) => x !== id)));
          const token = localStorage.getItem('toeic_token');
          if (token) {
            fetch('/api/progress/mark', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ cardId: id, learned: nextState })
            });
          }
        }}
        onEditCard={(card) => {
          setCardToEdit(card);
          setIsAddEditOpen(true);
        }}
        onDeleteCard={handleDeleteCard}
      />

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        cards={cards}
        onSaveQuizScore={handleSaveQuizScore}
        showToast={showToast}
      />

      <AddEditCardModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        cardToEdit={cardToEdit}
        onSaveCard={handleSaveCard}
        showToast={showToast}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
