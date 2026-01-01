import React from 'react';

export interface StockIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  chartData: number[];
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}
