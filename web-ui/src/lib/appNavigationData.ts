import {
  BookOpen,
  Bot,
  Command,
  CompassIcon,
  DraftingCompass,
  FolderUp,
  Frame,
  Gauge,
  icons,
  LifeBuoy,
  Map,
  MessagesSquare,
  Microscope,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"
import { title } from "process";

const appNavigationData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: Gauge
    },
    {
      title: "Chat",
      url: "/dashboard/workbuddychats/workbuddychat",
      icon: MessagesSquare
    },
    {
      title: "Challenges",
      url: "#",
      icon: Microscope,
      isActive: false,
      items: [
        {
          title: "Nothing here yet! Create?",
          url: "/dashboard/challenges/createchallenge",
        }
      ],
    },
    {
      title: "Solutions",
      url: "#",
      icon: CompassIcon,
      isActive: false,
      items: [
        {
          title: "Solution Outlines",
          url: "#",
        },
        {
          title: "To-Do",
          url: "#",
        },
        {
          title: "Mentor",
          url: "#",
        },
      ],
    },
    {
      title: "Uploads",
      url: "/dashboard/uploads",
      icon: FolderUp,
      isActive: false,
      items: [
        {
          title: "Datasets",
          url: "#",
        },
        {
          title: "Training Plans",
          url: "#",
        },
        {
          title: "Upload New",
          url: "/dashboard/uploads/new-upload",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      isActive: false,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export default appNavigationData;