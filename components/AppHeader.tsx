'use client';

import React from 'react';
import { APP_CONFIG } from '@/constants/appConfig';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ 
  title = APP_CONFIG.title,
  subtitle = APP_CONFIG.subtitle
}: AppHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white font-display">
        {title}
      </h1>
      <p className="text-primary-500 font-semibold text-sm mt-1">
        {subtitle}
      </p>
    </div>
  );
}

