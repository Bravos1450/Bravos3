
import React, { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3">
        {icon}
        <h1 className="text-3xl font-bold text-dark-text">{title}</h1>
      </div>
      {subtitle && <p className="mt-2 text-lg text-medium-text">{subtitle}</p>}
    </div>
  );
};

export default Header;
