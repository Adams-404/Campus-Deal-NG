
import * as React from "react"

import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}>({
  collapsed: false,
  setCollapsed: () => {},
})

interface SidebarProviderProps {
  children?: React.ReactNode
  defaultState?: boolean
}

function SidebarProvider({
  children,
  defaultState = false,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultState)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  children?: React.ReactNode
}

function Sidebar({ children, className, ...props }: SidebarProps) {
  const { collapsed } = React.useContext(SidebarContext)
  const isMobile = useMobile()

  return (
    <aside
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "h-screen fixed top-0 left-0 z-20 flex w-full flex-col bg-secondary/80 backdrop-blur-md border-r border-white/10 shadow-sm transition-all duration-300 ease-in-out data-[state=collapsed]:w-[80px] lg:relative lg:w-[300px]",
        isMobile && "data-[state=expanded]:w-[80%]",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarHeader({ className, ...props }: SidebarProps) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <div
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "flex h-16 items-center border-b border-white/5 px-6 transition-all",
        className
      )}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: SidebarProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto overflow-x-hidden p-4", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: SidebarProps) {
  return <div className={cn("p-4", className)} {...props} />
}

interface SidebarGroupProps extends SidebarProps {
  label?: string
}

function SidebarGroup({ children, className, label, ...props }: SidebarGroupProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      {children}
    </div>
  )
}

function SidebarGroupLabel({ className, ...props }: SidebarProps) {
  const { collapsed } = React.useContext(SidebarContext)

  if (collapsed) return null

  return (
    <div
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-3",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({ className, ...props }: SidebarProps) {
  return <div className={cn("", className)} {...props} />
}

function SidebarMenu({ className, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1 pl-1 pr-3",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: SidebarProps) {
  return <div className={cn("w-full", className)} {...props} />
}

function SidebarMenuButton({
  className,
  ...props
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  className?: string
  asChild?: boolean
}) {
  const { collapsed } = React.useContext(SidebarContext)

  if (props.asChild) {
    return React.cloneElement(
      React.Children.only(props.children) as React.ReactElement,
      {
        className: cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary-foreground/10 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0",
          collapsed && "justify-center p-3",
          className
        ),
      }
    )
  }

  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary-foreground/10 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0",
        collapsed && "justify-center p-3",
        className
      )}
      {...props}
    />
  )
}

function SidebarTrigger() {
  const { collapsed, setCollapsed } = React.useContext(SidebarContext)

  return (
    <button
      type="button"
      aria-label="Sidebar Toggle"
      className={cn(
        "fixed bottom-4 left-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground shadow-md",
        collapsed && "rotate-180"
      )}
      onClick={() => setCollapsed(!collapsed)}
    >
      <svg
        className="h-6 w-6"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 7l-5 5 5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        ></path>
      </svg>
    </button>
  )
}

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider,
}
