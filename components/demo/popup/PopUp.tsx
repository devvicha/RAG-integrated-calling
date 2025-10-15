/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>සම්පත් බැංකු හඬ සහායක වෙත සාදරයෙන් පිළිගනිමු</h2>
        <p>මෙය අපගේ AI බලයෙන් ක්‍රියාත්මක වන පාරිභෝගික සහාය සේවාවේ අන්තර්ක්‍රියාකාරී ආදර්ශනයකි.</p>
        <p>ආරම්භ කිරීමට:</p>
        <ol>
          <li><span className="icon">play_circle</span> හඬ සේවාව ආරම්භ කිරීමට Play බොත්තම ඔබන්න.</li>
          <li><span className="icon">mic</span> මයික්‍රෆෝන බොත්තම ඔබා කතා කරන්න.</li>
          <li><span className="icon">help_outline</span> ගිණුම් ශේෂය, නැතිවූ කාඩ්පත්, හෝ ණය ගැන විමසන්න.</li>
        </ol>
        <button onClick={onClose}>ආරම්භ කරන්න</button>
      </div>
    </div>
  );
};

export default PopUp;
