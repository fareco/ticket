import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import cx from 'classnames';

import BackIcon from 'icons/Back';
import HomeIcon from 'icons/Home';
import styles from './index.module.css';

export function ControlButton(props: ComponentPropsWithoutRef<'div'>) {
  const history = useHistory();
  const goBack = useCallback(() => history.goBack(), [history]);
  const goHome = useCallback(() => history.push('/'), [history]);

  const { pathname } = useLocation();

  return (
    <div
      {...props}
      className={cx(
        styles.shadow,
        'w-16 h-7 flex items-center bg-[#FAFAFA] text-[#888888] border border-gray-100 rounded-full overflow-hidden',
        props.className,
        {
          invisible: pathname === '/',
        }
      )}
    >
      <button
        className="flex-grow h-full flex justify-center items-center active:bg-gray-200"
        onClick={goBack}
      >
        <BackIcon />
      </button>
      <div className="bg-gray-200 h-4 w-px" />
      <button
        className="flex-grow h-full flex justify-center items-center active:bg-gray-200"
        onClick={goHome}
      >
        <HomeIcon />
      </button>
    </div>
  );
}
