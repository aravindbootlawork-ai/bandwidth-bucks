import styles from './progress-bar.module.css';

interface ProgressBarProps {
  percentage: number;
}

export function ProgressBar({ percentage }: ProgressBarProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  // Round to nearest 5 for CSS class selector
  const roundedPercentage = Math.round(clampedPercentage / 5) * 5;
  
  return (
    <div className={styles.progressBar}>
      <div 
        className={`${styles.progressFill} ${styles[`width${roundedPercentage}`]}`}
      />
    </div>
  );
}
