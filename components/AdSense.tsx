'use client';

import { useEffect, useState } from 'react';
import adsenseConfig from '@/data/adsenseConfig';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: React.CSSProperties;
  className?: string;
  fallbackContent?: React.ReactNode;
}

export default function AdSense({
  adSlot,
  adFormat = 'auto',
  adStyle,
  className,
  fallbackContent,
}: AdSenseProps) {
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // 检查是否应该显示广告
  const shouldShowAd =
    adsenseConfig.enabled &&
    (process.env.NODE_ENV === 'production' || adsenseConfig.showInDevelopment);

  useEffect(() => {
    if (!shouldShowAd) return;

    // 检查 AdSense 脚本是否被阻止
    const checkAdBlock = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.cssText = 'position:absolute;left:-10000px;top:-1000px;';
      document.body.appendChild(testAd);

      setTimeout(() => {
        if (testAd.offsetHeight === 0) {
          setIsAdBlocked(true);
        }
        document.body.removeChild(testAd);
      }, 100);
    };

    // 检查 AdSense 脚本是否加载成功
    const checkScriptLoaded = () => {
      if (
        typeof window !== 'undefined' &&
        (window as Window & { adsbygoogle?: unknown }).adsbygoogle
      ) {
        setIsScriptLoaded(true);
      } else {
        // 如果脚本没有加载，可能是被广告拦截器阻止了
        setTimeout(() => {
          if (!(window as Window & { adsbygoogle?: unknown }).adsbygoogle) {
            setIsAdBlocked(true);
          }
        }, 2000);
      }
    };

    checkAdBlock();
    checkScriptLoaded();

    // 尝试加载 AdSense
    if (isScriptLoaded) {
      try {
        const adsbygoogle = (window as Window & { adsbygoogle?: unknown[] })
          .adsbygoogle;
        if (adsbygoogle && Array.isArray(adsbygoogle)) {
          adsbygoogle.push({});
        }
      } catch (error) {
        console.warn('AdSense 加载失败，可能是被广告拦截器阻止:', error);
        setIsAdBlocked(true);
      }
    }
  }, [shouldShowAd, isScriptLoaded]);

  // 如果不应该显示广告，返回空内容
  if (!shouldShowAd) {
    return null;
  }

  // 如果广告被阻止，显示备用内容
  if (isAdBlocked) {
    return (
      <div className={`adsense-fallback ${className || ''}`}>
        {fallbackContent || (
          <div
            className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
            style={adStyle}
          >
            <p>广告被拦截器阻止</p>
            <p className="mt-1 text-xs">请考虑关闭广告拦截器以支持网站运营</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className || ''}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...adStyle,
        }}
        data-ad-client={adsenseConfig.clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
