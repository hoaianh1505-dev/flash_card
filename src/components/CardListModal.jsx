import React, { useState } from 'react';

export default function CardListModal({
  isOpen,
  onClose,
  cards,
  learnedCardIds,
  onToggleLearned,
  onEditCard,
  onDeleteCard
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCards = cards.filter((c) => {
    const isLearned = learnedCardIds.includes(c.cardId);
    if (filter === 'learned' && !isLearned) return false;
    if (filter === 'unlearned' && isLearned) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchWord = c.word.toLowerCase().includes(q);
      const matchMeaning = c.meanings && c.meanings.some((m) => m.text.toLowerCase().includes(q));
      return matchWord || matchMeaning;
    }
    return true;
  });

  const learnedCount = cards.filter((c) => learnedCardIds.includes(c.cardId)).length;
  const unlearnedCount = cards.length - learnedCount;

  return (
    <div className="modal show" id="reviewModal">
      <div className="box wide">
        <button className="closeX" onClick={onClose} aria-label="Đóng">×</button>
        <h2>📋 Quản lý Flashcard</h2>

        <div className="tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả <span className="tabCount">({cards.length})</span>
          </button>
          <button
            className={`tab ${filter === 'learned' ? 'active' : ''}`}
            onClick={() => setFilter('learned')}
          >
            ✓ Đã thuộc <span className="tabCount">({learnedCount})</span>
          </button>
          <button
            className={`tab ${filter === 'unlearned' ? 'active' : ''}`}
            onClick={() => setFilter('unlearned')}
          >
            ✗ Chưa thuộc <span className="tabCount">({unlearnedCount})</span>
          </button>
        </div>

        <input
          id="reviewSearch"
          placeholder="🔎 Tìm từ tiếng Anh hoặc nghĩa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="list" id="reviewList" style={{ marginTop: 12 }}>
          {filteredCards.length > 0 ? (
            filteredCards.map((c) => {
              const isLearned = learnedCardIds.includes(c.cardId);
              const mainMeaning = c.meanings && c.meanings[0] ? c.meanings[0].text : '';
              const pos = c.meanings && c.meanings[0] && c.meanings[0].type ? `(${c.meanings[0].type}) ` : '';

              return (
                <div key={c.cardId} className={`item ${isLearned ? 'learned' : ''}`}>
                  <div className="itemInfo" style={{ flex: 1 }}>
                    <span className="itemWord"><b>{c.word}</b></span>
                    <span className="itemMeaning">{pos}{mainMeaning}</span>
                  </div>

                  <button
                    className="soft"
                    onClick={() => onToggleLearned(c.cardId)}
                    title={isLearned ? 'Đánh dấu chưa thuộc' : 'Đánh dấu đã thuộc'}
                  >
                    {isLearned ? '✓' : '✗'}
                  </button>
                  <button
                    className="ghost"
                    onClick={() => onEditCard(c)}
                    title="Sửa từ"
                  >
                    ✎
                  </button>
                  <button
                    className="danger"
                    onClick={() => onDeleteCard(c.cardId)}
                    title="Xoá từ"
                  >
                    🗑
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty">Không tìm thấy từ vựng nào khớp với tìm kiếm.</div>
          )}
        </div>
      </div>
    </div>
  );
}
