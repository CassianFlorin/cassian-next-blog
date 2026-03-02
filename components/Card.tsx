'use client';

import { useRef } from 'react';
import Image from './Image';
import Link from './Link';
import { useScrollAnimation } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

const Card = ({ title, description, imgSrc, href }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useScrollAnimation(cardRef, fadeInUp(0, 'strong'), 0.12);

  return (
    <div
      ref={cardRef}
      className="md max-w-[544px] p-4 md:w-1/2"
      style={{ opacity: 0 }}
    >
      <div
        className={`${
          imgSrc && 'h-full'
        } group overflow-hidden rounded-2xl bg-white/60 transition-all duration-300 hover:bg-white hover:shadow-md dark:bg-gray-900/40 dark:hover:bg-gray-900/60`}
      >
        {imgSrc &&
          (href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              <Image
                alt={title}
                src={imgSrc}
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105 md:h-36 lg:h-48"
                width={544}
                height={306}
              />
            </Link>
          ) : (
            <Image
              alt={title}
              src={imgSrc}
              className="object-cover object-center md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          ))}
        <div className="p-6">
          <h2 className="mb-2 text-xl leading-7 font-semibold tracking-tight text-gray-800 dark:text-gray-100">
            {href ? (
              <Link
                href={href}
                aria-label={`Link to ${title}`}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          <p className="mb-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
          {href && (
            <Link
              href={href}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center text-sm font-medium transition-colors duration-200"
              aria-label={`Link to ${title}`}
            >
              Learn more
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
