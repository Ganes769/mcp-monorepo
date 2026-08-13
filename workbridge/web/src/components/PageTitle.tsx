import { cx, theme } from '../theme'
import { IconChevron } from './icons'

type Props = {
  section: string
  projectName?: string
}

export function PageTitle({ section, projectName }: Props) {
  const { classes } = theme

  return (
    <h1 className={cx('flex flex-wrap items-center gap-1.5 text-[22px] leading-7', classes.heading)}>
      <span>{section}</span>
      {projectName && (
        <>
          <IconChevron className="h-4 w-4 text-[#94A3B8]" />
          <span>{projectName}</span>
        </>
      )}
    </h1>
  )
}
