import{ AuthHeaderProps } from '@/types'


const AuthHeader = ({label, title}: AuthHeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
        <h1 className="text-3xl font-semibold text-black">{title}</h1>
        <p className="text-muted-foreground text-sm ">{label}</p>
    </div>
  )
}

export default AuthHeader