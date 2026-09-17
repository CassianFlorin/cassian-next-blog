import { getTranslations } from 'next-intl/server';
import Link from '@/components/Link';
import SectionHeading from '@/components/brand/SectionHeading';
import Reveal from '@/components/motion/Reveal';
import projectsData from '@/data/projectsData';

const HOME_PROJECTS = ['litho', 'skillHub', 'databaseCli'];

export default async function WorkSection() {
  const t = await getTranslations();
  const projects = HOME_PROJECTS.map((id) =>
    projectsData.find((project) => project.id === id),
  ).filter((project) => project !== undefined);

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="scroll-mt-6 py-24 md:py-36"
    >
      <SectionHeading
        id="work-title"
        index="01"
        title={t('home.work.title')}
        lede={t('home.work.lede')}
        description={t('home.work.description')}
        aside={
          <Link
            href="/projects"
            className="type-meta group inline-flex items-center gap-2 text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
          >
            {t('home.work.all')}
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        }
      />

      <Reveal
        variant="drift"
        as="ol"
        className="mt-16 grid border-t border-gray-900/15 md:mt-20 md:grid-cols-3 dark:border-white/15"
      >
        {projects.map((project, index) => {
          const external = !project.href?.startsWith('/');
          return (
            <li
              key={project.id}
              className="border-b border-gray-900/15 md:border-r md:border-b-0 md:first:*:pl-0 md:last:border-r-0 md:last:*:pr-0 dark:border-white/15"
            >
              <Link
                href={project.href || '/projects'}
                className="group ease-atelier relative flex h-full flex-col gap-5 py-8 transition-[transform,background-color] duration-500 hover:-translate-y-1 hover:bg-gray-900/[0.025] md:px-6 md:py-10 lg:px-8 dark:hover:bg-white/[0.03]"
              >
                <span className="type-meta text-gray-500 dark:text-gray-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[2rem] leading-none font-semibold tracking-[-0.03em] text-gray-950 lg:text-5xl dark:text-gray-50">
                  {project.title}
                </h3>
                <p className="type-meta text-gray-700 dark:text-gray-300">
                  {t(`projects.items.${project.id}.tagline`)}
                </p>
                <p className="type-meta text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300">
                  {project.techStack.slice(0, 3).join(' · ')}
                </p>
                <span
                  aria-hidden="true"
                  className="h-px w-full bg-gray-900/15 dark:bg-white/15"
                />
                <p className="text-base leading-7 text-gray-600 transition-colors duration-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100">
                  <span className="sr-only">{t('home.work.whyLabel')}: </span>
                  {t(`projects.items.${project.id}.why`)}
                </p>
                <span className="type-meta mt-auto flex items-center justify-between pt-4 text-gray-500 dark:text-gray-400">
                  <span className="transition-colors duration-200 group-hover:text-gray-950 dark:group-hover:text-gray-50">
                    {t('home.work.explore')}
                  </span>
                  <span
                    aria-hidden="true"
                    className="ease-atelier -translate-x-2 text-lg text-gray-950 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 dark:text-gray-50"
                  >
                    {external ? '↗' : '→'}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </Reveal>
    </section>
  );
}
