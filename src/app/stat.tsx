import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'

export function Stat({ title, value }: { title: string; value: string; }) {
  return (
    <div>
      <Divider />
      <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">{title}</div>
      <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{value}</div>
    </div>
  )
}
