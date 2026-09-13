import { useState, type RefObject } from 'react';
import type { BouquetStem } from '../types';
import { exportVaseImage } from '../utils/exportVaseImage';

export function VaseExportButton({ targetRef, bouquet }: { targetRef: RefObject<HTMLElement | null>; bouquet: BouquetStem[] }) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const label = status === 'exporting' ? '正在生成' : status === 'done' ? '已下载' : status === 'error' ? '重试导出' : '导出图片';

  const handleExport = async () => {
    if (!targetRef.current || status === 'exporting') return;
    setStatus('exporting');
    try {
      await exportVaseImage(targetRef.current, bouquet);
      setStatus('done');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch (error) {
      console.error(error);
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2400);
    }
  };

  return <button
    type="button"
    onClick={handleExport}
    disabled={status === 'exporting'}
    aria-live="polite"
    aria-label="导出当前花瓶图片"
    style={{
      padding: '4px 7px',
      border: '1px solid rgba(223, 255, 247, .42)',
      borderRadius: 999,
      background: 'rgba(8, 44, 56, .64)',
      boxShadow: '0 2px 8px rgba(0, 16, 27, .24)',
      color: '#effff8',
      fontSize: 10,
      lineHeight: 1.25,
      opacity: status === 'exporting' ? .66 : 1,
      whiteSpace: 'nowrap',
    }}
  >
    {status === 'exporting' ? '↓ ' : '⇩ '}{label}
  </button>;
}
