import type { ReactNode } from 'react';

export const RISK_WORDS = ['payment', 'liability', 'termination', 'confidentiality', 'indemnity', 'penalty'];

export function highlightRisk(text: string): ReactNode {
    const regex = new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi');
    if (!regex.test(text)) return text;

    return text
        .split(new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi'))
        .map((chunk, index) =>
            RISK_WORDS.includes(chunk.toLowerCase())
                ? (
                    <span
                        key={index}
                        style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 700,
                            padding: '0 3px',
                            borderRadius: '3px',
                            border: '1px solid #fde68a',
                        }}
                    >
                        {chunk}
                    </span>
                )
                : chunk
        );
}


export function actionColor(action: string): string {
    if (action.includes('DELETE')) return '#ef4444';
    if (action.includes('CREATE')) return '#10b981';
    if (action.includes('RESTORE')) return '#8b5cf6';
    return '#3b82f6';
}
