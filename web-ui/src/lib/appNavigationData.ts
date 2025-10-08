import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Gauge,
  icons,
  LifeBuoy,
  Map,
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
      title: "Challenges",
      url: "#",
      icon: Bot,
      isActive: false,
      items: [
        {
          title: "Nothing here yet! Create?",
          url: "#",
        }
      ],
    },
    {
      title: "Solutions",
      url: "#",
      icon: SquareTerminal,
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
      icon: BookOpen,
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
          title: "Documents",
          url: "/dashboard/uploads/documments",
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