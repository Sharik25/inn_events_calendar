import type { InputHTMLAttributes } from 'react';
import { cx } from '../cx';
import styles from './Checkbox.module.css';

/**
 * Native checkbox drawn in the app's style. Put it inside a <label> that spans the whole row, so
 * the row is the tap target (≥ 48px tall).
 */
export function Checkbox({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cx(styles.checkbox, className)} {...rest} />;
}
