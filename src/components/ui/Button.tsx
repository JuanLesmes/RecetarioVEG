import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconFilled?: boolean;
  iconOnly?: boolean;
  block?: boolean;
  active?: boolean;
  children?: ReactNode;
  className?: string;
}

type ButtonAsButton = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined };
type ButtonAsLink = BaseProps & Omit<LinkProps, 'className' | 'children'> & { to: LinkProps['to'] };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes({ variant = 'secondary', size = 'md', iconOnly, block, active, className }: BaseProps): string {
  return [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    iconOnly ? 'btn--icon' : '',
    block ? 'btn--block' : '',
    active ? 'is-active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button(props: ButtonProps) {
  const { variant, size, icon, iconFilled, iconOnly, block, active, children, className, ...rest } = props;
  const cls = classes({ variant, size, iconOnly, block, active, className });
  const content = (
    <>
      {icon ? <Icon name={icon} filled={iconFilled} /> : null}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </>
  );
  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link to={to} className={cls} {...linkRest}>
        {content}
      </Link>
    );
  }
  const { type = 'button', ...buttonRest } = rest as ButtonAsButton;
  return (
    <button type={type} className={cls} {...buttonRest}>
      {content}
    </button>
  );
}
