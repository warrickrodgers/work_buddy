// web-ui/src/lib/appNavigationData.ts
import {
  CompassIcon,
  FolderUp,
  Frame,
  Gauge,
  LifeBuoy,
  Map,
  MessagesSquare,
  Microscope,
  PieChart,
  Send,
  Settings2,
} from "lucide-react"

// Define Challenge type (simplified version for navigation)
interface Challenge {
  id: number;
  title: string;
}

const getAppNavigationData = (challenges: Challenge[] = []) => {
  // Map challenges to navigation items, or show generic "Challenges" if empty
  const challengeItems = challenges.length > 0 
    ? challenges.map(challenge => ({
        title: challenge.title,
        url: `/dashboard/challenges/${challenge.id}`,
      }))
    : [
        {
          title: challenges.length > 0 ? "Create challenge" : "Nothing here yet! Create?",
          url: "/dashboard/challenges/createchallenge",
        }
      ];

  return {
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
        url: "/dashboard/challenges/",
        icon: Microscope,
        isActive: false,
        items: challengeItems,
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
  };
};

export default getAppNavigationData;
export type { Challenge };