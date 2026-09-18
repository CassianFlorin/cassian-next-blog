// 新正文组件的起步模板。复制到 components/<Name>.tsx 后按内容改。
// 规则见 CLAUDE.md 第 2、4 节与本目录 SKILL.md。

interface ExampleRecordProps {
  /** 组件左上角的 meta 标签，说明这是什么（如 DECISION / SPEC / TIMELINE）。 */
  label: string;
  /** 主标题，一句话。 */
  title: string;
  /** 键值行；键用 meta 样式，值可以是多行文字。 */
  fields?: { key: string; value: string }[];
  /** 自由正文，Markdown 子节点会以 not-prose 方式渲染，样式由本组件负责。 */
  children?: React.ReactNode;
}

export default function ExampleRecord({
  label,
  title,
  fields,
  children,
}: ExampleRecordProps) {
  return (
    <section
      aria-label={label}
      className="not-prose surface-paper border-primary-600 dark:border-primary-400 my-6 w-full max-w-full border-l-2 px-4 py-3 sm:px-5 sm:py-4"
    >
      <p className="type-meta text-primary-700 dark:text-primary-300 mb-2">
        {label}
      </p>
      <h4 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-gray-100">
        {title}
      </h4>

      {fields && fields.length > 0 && (
        <dl className="mt-3 divide-y divide-gray-200 text-sm dark:divide-gray-800">
          {fields.map(({ key, value }) => (
            <div key={key} className="grid grid-cols-[6rem_1fr] gap-3 py-2">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {key}
              </dt>
              <dd className="font-mono text-xs leading-6 break-words text-gray-800 dark:text-gray-200">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {children && (
        <div className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300 [&_code]:bg-gray-200/70 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-gray-800 dark:[&_code]:bg-gray-950/70 dark:[&_code]:text-gray-200">
          {children}
        </div>
      )}
    </section>
  );
}
