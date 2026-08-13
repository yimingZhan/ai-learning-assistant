export default [
  {
    path: "/assistant",
    name: "assistant",
    icon: "message",
    component: "./Assistant",
  },
  {
    path: "/quality",
    name: "quality",
    icon: "audit",
    routes: [
      {
        path: "/quality",
        redirect: "/quality/conversation",
      },
      {
        path: "/quality/conversation",
        name: "conversation",
        component: "./Quality/Conversation",
      },
      {
        path: "/quality/employee-complaints",
        name: "employeeComplaints",
        component: "./Quality/EmployeeComplaints",
      },
    ],
  },
  {
    path: "/renewal",
    name: "renewal",
    icon: "rise",
    routes: [
      {
        path: "/renewal",
        redirect: "/renewal/opportunities",
      },
      {
        path: "/renewal/opportunities",
        name: "opportunities",
        component: "./Renewal/Opportunities",
      },
      {
        path: "/renewal/diagnosis",
        name: "diagnosis",
        component: "./Renewal/Diagnosis",
        hideInMenu: true,
      },
      {
        path: "/renewal/prediction",
        redirect: "/renewal/opportunities",
        hideInMenu: true,
      },
    ],
  },
  {
    path: "/ai-config",
    name: "aiConfig",
    icon: "setting",
    routes: [
      {
        path: "/ai-config",
        redirect: "/ai-config/platform-assistant",
      },
      {
        path: "/ai-config/platform-assistant",
        name: "platformAssistant",
        component: "./AIConfig/PlatformAssistant",
      },
      {
        path: "/ai-config/complaint-risk",
        name: "complaintRisk",
        component: "./AIConfig/ComplaintRisk",
      },
      {
        path: "/ai-config/renewal",
        name: "renewal",
        component: "./AIConfig/Renewal",
      },
    ],
  },
  {
    path: "/work-reminders",
    name: "workReminders",
    hideInMenu: true,
    component: "./WorkReminders",
  },
  {
    path: "/",
    redirect: "/quality/conversation",
  },
  {
    path: "/*",
    component: "./404",
    layout: false,
  },
];
