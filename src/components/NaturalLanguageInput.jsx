import React, { useState, useMemo } from 'react';
import { useTodo } from '../context/TodoContext';
import { parseNaturalLanguageTask } from '../utils/nlpParser';
import { Plus, Sparkles, Calendar, Tag, AlertCircle } from 'lucide-react';

export const NaturalLanguageInput = () => {
  const { addTask } = useTodo();
  const [inputText, setInputText] = useState('');

  // Live NLP preview parsing as user types
  const parsedPreview = useMemo(() => {
    if (!inputText.trim()) return null;
    return parseNaturalLanguageTask(inputText);
  }, [inputText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addTask(inputText);
    setInputText('');
  };

  const handleApplyExample = (example) => {
    setInputText(example);
  };

  return (
    <div className="nlp-input-wrapper">
      <form onSubmit={handleSubmit} className="nlp-input-row">
        <div className="nlp-input-icon">
          <Sparkles size={19} />
        </div>

        <input
          type="text"
          className="nlp-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Add a task or say 'remind me to prepare presentation tomorrow at 3pm #work !high'..."
          aria-label="Add task natural language input"
        />

        <button type="submit" className="nlp-submit-btn" disabled={!inputText.trim()}>
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </form>

      {/* Live AI / NLP Parsed Preview Tokens */}
      {parsedPreview && parsedPreview.detectedTokens && parsedPreview.detectedTokens.length > 0 && (
        <div className="nlp-preview-bar">
          <span className="nlp-preview-label">
            <Sparkles size={12} style={{ color: 'var(--ai-purple)' }} />
            AI Detected:
          </span>

          {parsedPreview.detectedTokens.map((token, idx) => {
            if (token.type === 'date' || token.type === 'time') {
              return (
                <span key={idx} className="nlp-token-pill token-date">
                  <Calendar size={11} />
                  {token.value}
                </span>
              );
            }
            if (token.type === 'priority') {
              return (
                <span key={idx} className="nlp-token-pill token-priority">
                  <AlertCircle size={11} />
                  {token.value}
                </span>
              );
            }
            if (token.type === 'tag') {
              return (
                <span key={idx} className="nlp-token-pill token-tag">
                  <Tag size={11} />
                  {token.value}
                </span>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Quick Prompt Suggestions when empty */}
      {!inputText && (
        <div className="nlp-preview-bar" style={{ borderTop: 'none', paddingTop: 0, marginTop: '6px' }}>
          <span className="nlp-preview-label" style={{ fontSize: '0.72rem' }}>
            Try typing:
          </span>
          <div className="nlp-quick-examples">
            <span
              className="nlp-example-chip"
              onClick={() => handleApplyExample("Book flights to Tokyo next Friday at 10am #travel !high")}
            >
              "Book flights next Friday at 10am #travel"
            </span>
            <span
              className="nlp-example-chip"
              onClick={() => handleApplyExample("Team architecture review today at 4pm #work !high")}
            >
              "Team review today 4pm !high"
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
