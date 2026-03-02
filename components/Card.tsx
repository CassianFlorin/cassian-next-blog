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
        } overflow-hidden rounded-md border-2 border-gray-200/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:border-gray-700/60`}
      >
        {imgSrc &&
          (href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              <Image
                alt={title}
                src={imgSrc}
                className="object-cover object-center transition-transform duration-500 hover:scale-105 md:h-36 lg:h-48"
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
          <h2 className="mb-3 text-2xl leading-8 font-bold tracking-tight">
            {href ? (
              <Link href={href} aria-label={`Link to ${title}`}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">
            {description}
          </p>
          {href && (
            <Link
              href={href}
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-base leading-6 font-medium transition-all duration-200"
              aria-label={`Link to ${title}`}
            >
              Learn more &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
