import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function QuizModal({ isOpen, onClose, cards, onSaveQuizScore, showToast }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen && cards.length >= 4) {
      startNewQuiz();
    }
  }, [isOpen]);

  const startNewQuiz = () => {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    const selected10 = shuffled.slice(0, Math.min(10, cards.length));

    const generated = selected10.map((target) => {
      const targetMeaning = target.meanings && target.meanings[0] ? target.meanings[0].text : 'Nghĩa tiếng Việt';
      
      const otherCards = cards.filter((c) => c.cardId !== target.cardId);
      const otherShuffled = [...otherCards].sort(() => 0.5 - Math.random()).slice(0, 3);
      const distractors = otherShuffled.map((c) => (c.meanings && c.meanings[0] ? c.meanings[0].text : 'Nghĩa khác'));

      const options = [targetMeaning, ...distractors].sort(() => 0.5 - Math.random());

      return {
        card: target,
        correctAnswer: targetMeaning,
        options
      };
    });

    setQuestions(generated);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        const finalScore = score + (isCorrect ? 1 : 0);
        setIsFinished(true);
        onSaveQuizScore(finalScore, questions.length);

        if (finalScore >= 7) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 1200);
  };

  return (
    <div className="modal show" id="quizModal">
      <div className="box">
        <button className="closeX" onClick={onClose} aria-label="Đóng">×</button>
        <h2>📝 Trắc nghiệm nhanh</h2>

        {!isFinished ? (
          currentQ ? (
            <div id="quizBody">
              <div className="quizQ">
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>
                  Câu {currentIdx + 1} / {questions.length} · Điểm: {score}
                </div>
                <div className="qWord">{currentQ.card.word}</div>
              </div>

              <div className="quizOptions">
                {currentQ.options.map((opt, idx) => {
                  let optClass = 'quizOpt';
                  if (selectedOption !== null) {
                    if (opt === currentQ.correctAnswer) {
                      optClass += ' correct';
                    } else if (opt === selectedOption) {
                      optClass += ' wrong';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      className={optClass}
                      onClick={() => handleSelectOption(opt)}
                      disabled={selectedOption !== null}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>Đang tải câu hỏi...</div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>
              {score >= 8 ? '🎉' : score >= 5 ? '👏' : '💪'}
            </div>
            <h3 style={{ fontSize: 22, margin: '0 0 10px' }}>
              {score >= 8 ? 'Tuyệt vời! Kết quả rất xuất sắc' : score >= 5 ? 'Làm tốt lắm!' : 'Cố gắng lên nhé!'}
            </h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
              Bạn đạt được <b>{score} / {questions.length}</b> câu trả lời chính xác.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="primary" onClick={startNewQuiz}>Làm bài mới</button>
              <button className="soft" onClick={onClose}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
