'use client';

import React from 'react';
import { Github, Youtube, ExternalLink, Info, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-dark-600 bg-dark-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Repository */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
              <Github className="w-4 h-4 mr-2" />
              Repository
            </h3>
            <a
              href="https://github.com/Baptiste-Yucca/demo-rent2repay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-primary-500 transition-colors flex items-center group"
            >
              demo-rent2repay
              <ExternalLink className="w-3 h-3 ml-1 group-hover:text-primary-500 transition-colors" />
            </a>
          </div>

          {/* Creator */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Creator</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Battistu</p>
              <a
                href="https://www.youtube.com/@YesYuccan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-primary-500 transition-colors flex items-center group"
              >
                <Youtube className="w-4 h-4 mr-2" />
                YesYuccan
                <ExternalLink className="w-3 h-3 ml-1 group-hover:text-primary-500 transition-colors" />
              </a>
              <a
                href="https://t.me/BaptisteYucca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-primary-500 transition-colors flex items-center group"
              >
                <Send className="w-4 h-4 mr-2" />
                @BaptisteYucca
                <ExternalLink className="w-3 h-3 ml-1 group-hover:text-primary-500 transition-colors" />
              </a>
            </div>
          </div>
          {/* More Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              More Information
            </h3>
            <a
              href="https://forum.realtoken.community/d/93-rent2repay-config"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-primary-500 transition-colors flex items-center group"
            >
              RealToken Forum
              <ExternalLink className="w-3 h-3 ml-1 group-hover:text-primary-500 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

