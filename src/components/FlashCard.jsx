import React, { useState } from 'react';

export default function FlashCard({
  card,
  currentIndex,
  totalFiltered,
  isLearned,
  isFlipped,
  setIsFlipped,
  onPrev,
  onNext,
  onMark,
  onEdit,
  isAutoPlay
}) {
  const [speechRate, setSpeechRate] = useState(0.85);

  if (!card) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
        Không tìm thấy thẻ từ vựng tương ứng với bộ lọc.
      </div>
    );
  }

  const speakWord = (e) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = (e) => {
    // Prevent flipping if user is selecting text or clicking tool buttons
    setIsFlipped(!isFlipped);
  };

  return (
    <>
      <div
        className={`card ${isFlipped ? 'flipped' : ''}`}
        id="flashcard"
        onClick={handleCardClick}
      >
        <span className="cardCount" id="cardCount">
          {currentIndex + 1} / {totalFiltered}
          {isAutoPlay && <span style={{ color: 'var(--teal)', marginLeft: 8, fontWeight: 700 }}>▶ Tự chạy</span>}
        </span>

        <div className="cardTools">
          <button
            id="speechSpeedBtn"
            onClick={(e) => {
              e.stopPropagation();
              setSpeechRate((prev) => (prev === 0.85 ? 0.65 : 0.85));
            }}
            title="Đổi tốc độ đọc (Bình thường / Chậm)"
            style={{ fontSize: 12, fontWeight: 700, width: 44, borderRadius: 12 }}
          >
            {speechRate === 0.65 ? '0.6x 🐢' : '1.0x ⚡'}
          </button>

          <button
            id="speakIconBtn"
            onClick={speakWord}
            title="Phát âm chuẩn tiếng Anh (S)"
          >
            🔊
          </button>

          <button
            id="editIconBtn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            title="Sửa từ và nghĩa"
          >
            ✎
          </button>
        </div>

        <div className="inner">
          <div className="face">
            <div className="label">ENGLISH</div>
            <div className="word" id="word">
              {card.word}
            </div>
            <div className="hint">👆 Bấm vào thẻ để xem nghĩa</div>
          </div>

          <div className="face back">
            <div className="label">TIẾNG VIỆT</div>
            <div className="meaningList" id="meaningList">
              {card.meanings && card.meanings.length > 0 ? (
                card.meanings.map((m, idx) => (
                  <div className="meaningItem" key={idx}>
                    {m.type && <span style={{ fontSize: 14, color: 'var(--teal)', marginRight: 6 }}>({m.type})</span>}
                    {m.text}
                    {m.phonetic && <div style={{ fontSize: 14, color: 'var(--ink-faint)', marginTop: 4 }}>{m.phonetic}</div>}
                  </div>
                ))
              ) : (
                <div className="meaningItem">Chưa có nghĩa</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="soft"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          ← Trước
        </button>

        <button
          className="danger"
          onClick={(e) => {
            e.stopPropagation();
            onMark(false);
          }}
        >
          ✗ Chưa thuộc <kbd style={{ marginLeft: 4 }}>C</kbd>
        </button>

        <button
          className="success"
          onClick={(e) => {
            e.stopPropagation();
            onMark(true);
          }}
        >
          ✓ Đã thuộc <kbd style={{ marginLeft: 4 }}>V</kbd>
        </button>

        <button
          className="soft"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          Tiếp →
        </button>
      </div>

      <div className="statusRow">
        <span className={`dot ${isLearned ? 'ok' : ''}`} id="statusDot" />
        <span id="statusText">{isLearned ? 'Đã thuộc' : 'Chưa thuộc'}</span>
      </div>

      <div className="progress">
        <div
          id="progressBar"
          style={{ width: `${((currentIndex + 1) / totalFiltered) * 100}%` }}
        />
      </div>

      <div className="kbdHint">
        Phím tắt: <kbd>←</kbd> <kbd>→</kbd> chuyển thẻ · <kbd>Space</kbd> lật thẻ · <kbd>C</kbd> chưa thuộc · <kbd>V</kbd> đã thuộc · <kbd>S</kbd> phát âm
      </div>
    </>
  );
}
