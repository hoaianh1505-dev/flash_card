import React from 'react';

export default function Toolbar({
  mode,
  setMode,
  searchQuery,
  setSearchQuery,
  onShuffle,
  onOpenQuiz,
  autoSpeak,
  setAutoSpeak,
  isAutoPlay,
  setIsAutoPlay,
  onExportData,
  onImportData
}) {
  return (
    <div className="toolbar">
      <div className="modeBar">
        <button
          className={`modeBtn ${mode === 'all' ? 'active' : ''}`}
          onClick={() => setMode('all')}
        >
          Tất cả
        </button>
        <button
          className={`modeBtn ${mode === 'unlearned' ? 'active' : ''}`}
          onClick={() => setMode('unlearned')}
        >
          Chưa thuộc
        </button>
        <button
          className={`modeBtn ${mode === 'learned' ? 'active' : ''}`}
          onClick={() => setMode('learned')}
        >
          Đã thuộc
        </button>
      </div>

      <input
        className="searchBox"
        type="text"
        placeholder="🔎 Tìm nhanh & nhảy tới thẻ..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="ghost" onClick={onShuffle} title="Trộn ngẫu nhiên danh sách từ">
          🔀 Trộn
        </button>

        <button
          className={autoSpeak ? 'soft' : 'ghost'}
          onClick={() => setAutoSpeak(!autoSpeak)}
          title="Tự động đọc phát âm tiếng Anh khi đổi thẻ"
        >
          {autoSpeak ? '🔊 Tự đọc: Bật' : '🔇 Tự đọc: Tắt'}
        </button>

        <button
          className={isAutoPlay ? 'primary' : 'ghost'}
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          title="Chế độ rảnh tay: Tự động lật và chuyển thẻ sau 3 giây"
        >
          {isAutoPlay ? '⏸ Dừng chạy' : '▶ Tự chạy'}
        </button>

        <button className="ghost" onClick={onOpenQuiz} title="Trắc nghiệm nhanh 10 từ">
          📝 Trắc nghiệm
        </button>

        <button className="ghost" onClick={onExportData} title="Sao lưu tiến độ ra file JSON">
          💾 Sao lưu JSON
        </button>
      </div>
    </div>
  );
}
