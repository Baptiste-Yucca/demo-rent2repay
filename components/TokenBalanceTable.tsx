'use client';

import React from 'react';

interface TokenBalanceItem {
  label: string;
  balance: unknown;
  decimals: number;
}

interface TokenBalanceTableProps {
  title: string;
  data: TokenBalanceItem[];
  formatBalance: (balance: unknown, decimals: number) => string;
}

export default function TokenBalanceTable({ 
  title, 
  data, 
  formatBalance 
}: TokenBalanceTableProps) {
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold text-white mb-3 font-display">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left py-2 px-3 text-gray-300 font-semibold">Token</th>
              <th className="text-right py-2 px-3 text-gray-300 font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-dark-600/50">
                <td className="py-2 px-3 text-gray-400">{item.label}</td>
                <td className="py-2 px-3 text-right font-mono text-primary-500">
                  {formatBalance(item.balance, item.decimals)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

