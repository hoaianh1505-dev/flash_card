import React, { useState, useEffect, useRef } from 'react';

export default function AddEditCardModal({ isOpen, onClose, cardToEdit, onSaveCard, showToast }) {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');

  const wordInputRef = useRef(null);

  useEffect(() => {
    if (cardToEdit) {
      setWord(cardToEdit.word || '');
      setMeaning(cardToEdit.meanings && cardToEdit.meanings[0] ? cardToEdit.meanings[0].text : '');
    } else {
      setWord('');
      setMeaning('');
    }
  }, [cardToEdit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => wordInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      showToast('❌ Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.');
      return;
    }

    const payload = {
      cardId: cardToEdit ? cardToEdit.cardId : null,
      word: word.trim(),
      meaning: meaning.trim()
    };

    onSaveCard(payload);

    if (!cardToEdit) {
      // REQUIREMENT: Keep modal open, clear fields, and focus word input for next word
      setWord('');
      setMeaning('');
      setTimeout(() => wordInputRef.current?.focus(), 50);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal show" id="editModal">
      <div className="box wide">
        <button className="closeX" onClick={onClose} aria-label="Đóng">×</button>
        <h2 id="editTitle">{cardToEdit ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới'}</h2>

        <form onSubmit={handleSubmit}>
          <label>Từ / cụm từ tiếng Anh
            <input
              ref={wordInputRef}
              id="wordInput"
              placeholder="Ví dụ: precise"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <label>Nghĩa tiếng Việt
            <input
              id="meaningInput"
              placeholder="Ví dụ: chắc chắn / chính xác"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              autoComplete="off"
              required
            />
          </label>

          {!cardToEdit && (
            <div className="enterHint" style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
              💡 <i>Mẹo: Nếu từ đã tồn tại, hệ thống sẽ tự động gộp thêm nghĩa mới vào từ đó. Hộp thoại sẽ mở tiếp để bạn nhập liên tục.</i>
            </div>
          )}

          <div className="formBtns" style={{ marginTop: 14 }}>
            <button type="button" className="soft" onClick={onClose}>Huỷ / Đóng</button>
            <button type="submit" className="primary">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
}
