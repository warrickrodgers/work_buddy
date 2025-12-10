# Project Structure

work_buddy/
├── README.md
├── agent-server/
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── context/
│       │   ├── goals.json
│       │   ├── objectives.md
│       │   ├── purpose.md
│       │   └── role.md
│       ├── controllers/
│       │   └── conversationController.ts
│       ├── knowledge/
│       │   ├── example_insights.md
│       │   ├── improvement_frameworks.md
│       │   └── leadership_models.md
│       ├── llm/
│       │   ├── geminiAIClient.ts
│       │   ├── outputParser.ts
│       │   └── promptBuilder.ts
│       ├── routes/
│       │   ├── analyze.ts
│       │   ├── conversations.ts
│       │   ├── generatePlan.ts
│       │   └── health.ts
│       ├── services/
│       │   ├── analysis.ts
│       │   ├── chromaService.ts
│       │   ├── insightGenerator.ts
│       │   └── reportBuilder.ts
│       └── utils/
│           ├── fileHelpers.ts
│           └── logger.ts
├── bi-app/
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── readme.md
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       ├── 20250416141305_initial/
│   │       │   └── migration.sql
│   │       ├── 20250903034244_dev1/
│   │       │   └── migration.sql
│   │       ├── 20250903041034_dev2/
│   │       │   └── migration.sql
│   │       ├── 20250909041014_relation_patch_1/
│   │       │   └── migration.sql
│   │       └── 20251022035135_add_chat_conversations/
│   │           └── migration.sql
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── conversationController.ts
│       │   ├── problemRequestController.ts
│       │   └── uploadController.ts
│       ├── lib/
│       │   ├── errors.ts
│       │   ├── prisma.ts
│       │   └── db/
│       │       └── db.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── uploadMiddleware.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── authRoutes/
│       │   │   └── authRoutes.ts
│       │   ├── conversationRoutes/
│       │   │   └── conversationRoutes.ts
│       │   ├── problemRequestRoutes/
│       │   │   └── problemRequestsRoutes.ts
│       │   └── uploadRoutes/
│       │       └── uploadRoutes.ts
│       ├── services/
│       │   └── openAiService.ts
│       └── types/
│           └── index.ts
└── web-ui/
    ├── .gitignore
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public/
    │   ├── horizontal.png
    │   ├── logo-transparent.png
    │   ├── logo.png
    │   ├── story.png
    │   └── vite.svg
    └── src/
        ├── App.css
        ├── App.tsx
        ├── main.tsx
        ├── vite-env.d.ts
        ├── assets/
        │   └── react.svg
        ├── components/
        │   ├── app-sidebar.tsx
        │   ├── nav-main.tsx
        │   ├── nav-projects.tsx
        │   ├── nav-secondary.tsx
        │   ├── nav-user.tsx
        │   ├── PrivateRoute.tsx
        │   ├── search-form.tsx
        │   ├── version-switcher.tsx
        │   └── ui/
        │       ├── avatar.tsx
        │       ├── breadcrumb.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── collapsible.tsx
        │       ├── dropdown-menu.tsx
        │       ├── dropzone.tsx
        │       ├── form.tsx
        │       ├── input.tsx
        │       ├── item.tsx
        │       ├── label.tsx
        │       ├── separator.tsx
        │       ├── sheet.tsx
        │       ├── sidebar.tsx
        │       ├── skeleton.tsx
        │       ├── textarea.tsx
        │       └── tooltip.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── hooks/
        │   └── use-mobile.ts
        ├── lib/
        │   ├── api.ts
        │   ├── appNavigationData.ts
        │   └── utils.ts
        └── pages/
            ├── Home.tsx
            ├── auth/
            │   ├── ForgotPassowrd.tsx
            │   ├── Login.tsx
            │   └── SignUp.tsx
            ├── dashboard/
            │   ├── Dashboard.tsx
            │   └── dashPages/
            │       ├── Uploads/
            │       │   ├── NewUpload.tsx
            │       │   └── Uploads.tsx
            │       └── WorkBuddyChats.tsx/
            │           └── WorkBuddyChat.tsx
