/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  const title = 'සම්පත් බැංකු සහායක';
  const description = 'ගිණුම් ශේෂ, කාඩ්පත් සේවා, සහ ණය පිළිබඳ තොරතුරු ලබාගන්න.';
  const prompts = [
    'මගේ balance එක කීයද?',
    'Credit card එක නැති උනා.',
    'Loan එකක් ගැන විස්තර කියන්න.',
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="title-container">
          <span className="welcome-icon">mic</span>
          <h2 className="welcome-title">{title}</h2>
        </div>
        <p>{description}</p>
        <div className="example-prompts">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt">{prompt}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;