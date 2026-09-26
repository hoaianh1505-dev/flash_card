import React from 'react';

export default function StatsOverview({ total, learned, remain, masteryPct }) {
  return (
    <div className="stats">
      <div className="stat">
        <b>{total}</b>
        <span>Tổng số thẻ</span>
      </div>
      <div className="stat">
        <b>{learned}</b>
        <span>Đã thuộc</span>
      </div>
      <div className="stat">
        <b>{remain}</b>
        <span>Chưa thuộc</span>
      </div>
      <div className="stat mastery">
        <b>{masteryPct}%</b>
        <span>Mức độ thuộc</span>
      </div>
    </div>
  );
}
