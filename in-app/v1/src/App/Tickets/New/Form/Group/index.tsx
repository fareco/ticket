import { ComponentPropsWithoutRef, ReactNode, createContext, useContext } from 'react';
import cx from 'classnames';

import styles from './index.module.css';

interface GroupContextType {
  controlId?: string;
  required?: boolean;
}

const GroupContext = createContext<GroupContextType>({});

export function GroupLabel(props: ComponentPropsWithoutRef<'label'>) {
  const { controlId, required } = useContext(GroupContext);

  return (
    <label
      {...props}
      className={cx('break-words sm:w-[60px] sm:mr-4 mb-2 sm:mb-0', props.className, {
        [styles.required]: required,
      })}
      htmlFor={props.htmlFor ?? controlId}
    />
  );
}

export function GroupField(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cx('flex-grow', props.className)} />;
}

export interface GroupProps {
  title?: string;
  required?: boolean;
  children?: ReactNode;
  labelAtTop: boolean;
}

export function Group({ title, required, children, labelAtTop }: GroupProps) {
  return (
    <div className="flex flex-col sm:flex-row mb-5 last:mb-0">
      <div className="flex-shrink-0 mb-2 sm:mb-0 sm:w-[60px] sm:mr-4">
        {title && (
          <label
            className={cx('relative break-words', {
              [styles.required]: required,
              'sm:top-[7px]': !labelAtTop,
            })}
          >
            {title}
          </label>
        )}
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
