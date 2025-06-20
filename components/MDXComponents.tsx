// import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import Callout from './Callout'
import ErrorDisplay from './ErrorDisplay'
import StepProgress from './StepProgress'
import CopyableCodeBlock from './CopyableCodeBlock'
import EnvironmentComparison from './EnvironmentComparison'

export const components: MDXComponents = {
  Image,
  // TOCInline,
  a: CustomLink,
  pre: CopyableCodeBlock,
  // BlogNewsletterForm,
  table: TableWrapper,
  Callout,
  ErrorDisplay,
  StepProgress,
  EnvironmentComparison,
  CopyableCodeBlock,
}
