# Project Structure

├── README.md
├── project_structure.md
├── agent-server/
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   └── src/
│       ├── context/
│       │   ├── goals/
│       │   │   ├── core_principles.md
│       │   │   ├── goals.md
│       │   │   ├── inspiration.md
│       │   │   ├── secondary objectives.md
│       │   │   └── tone_and_voice.md
│       │   ├── objectives/
│       │   │   ├── behavioural_commitments.md
│       │   │   ├── core_objectives.md
│       │   │   ├── guiding_philosophy.md
│       │   │   ├── long_term_vision.md
│       │   │   ├── measuring_success.md
│       │   │   ├── mission.md
│       │   │   └── vision.md
│       │   ├── purpose/
│       │   │   ├── how_simon_lives_purpose.md
│       │   │   ├── purpose.md
│       │   │   ├── simons_promise.md
│       │   │   ├── what_simon_believes.md
│       │   │   └── why_simon_exists.md
│       │   └── role/
│       │       ├── desired_impact.md
│       │       ├── guiding_philosohpy.md
│       │       ├── responsibilieties.md
│       │       └── role.md
│       ├── controllers/
│       │   └── conversationController.ts
│       ├── knowledge/
│       │   ├── improvement_frameworks/
│       │   │   ├── 1_why_how_what_framework.md
│       │   │   ├── 2_ubuntu_principle.md
│       │   │   ├── 3_human_relations_framework.md
│       │   │   ├── 4_growth_mindset.md
│       │   │   ├── 5_integrative_change_model.md
│       │   │   ├── 6_supporting_process_framework.md
│       │   │   ├── 7_measuring_meaningful_progress.md
│       │   │   └── 8_guiding_mantra.md
│       │   ├── insights/
│       │   │   ├── change_insights.md
│       │   │   ├── collaboration_insights.md
│       │   │   ├── developmentatl_insights.md
│       │   │   ├── engagement_insights.md
│       │   │   ├── leadership_alignment_insights.md
│       │   │   ├── purpose_insights.md
│       │   │   ├── resilience_insights.md
│       │   │   └── trust_insights.md
│       │   └── leadership_models/
│       │       ├── 1_transformational_leadership.md
│       │       ├── 2_situational_leadership.md
│       │       ├── 3_emotional_intelligence.md
│       │       ├── 4_servant_leadership.md
│       │       ├── 5_adaptive_leadership.md
│       │       ├── 6_human_motivation.md
│       │       ├── 7_organizational_culture.md
│       │       ├── 8_leadership_in_practice.md
│       │       ├── core_leadership_frameworks.md
│       │       └── guiding_philosophy.md
│       ├── index.ts
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
│       │   ├── knowledgeLoader.ts
│       │   └── reportBuilder.ts
│       └── utils/
│           ├── fileHelpers.ts
│           └── logger.ts
├── bi-app/
│   ├── package.json
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20250416141305_initial/
│   │   │   ├── 20250903034244_dev1/
│   │   │   ├── 20250903041034_dev2/
│   │   │   ├── 20250909041014_relation_patch_1/
│   │   │   ├── 20251022035135_add_chat_conversations/
│   │   │   ├── 20251209051713_add_challenges/
│   │   │   └── 20251210070048_fix_challenges/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── readme.md
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── challengeController.ts
│       │   ├── conversationController.ts
│       │   ├── problemRequestController.ts
│       │   └── uploadController.ts
│       ├── lib/
│       │   ├── db/
│       │   │   └── db.ts
│       │   ├── errors.ts
│       │   └── prisma.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── uploadMiddleware.ts
│       ├── routes/
│       │   ├── authRoutes/
│       │   │   └── authRoutes.ts
│       │   ├── challengeRoutes/
│       │   │   └── challengeROutes.ts
│       │   ├── conversationRoutes/
│       │   │   └── conversationRoutes.ts
│       │   ├── index.ts
│       │   ├── problemRequestRoutes/
│       │   │   └── problemRequestsRoutes.ts
│       │   └── uploadRoutes/
│       │       └── uploadRoutes.ts
│       ├── server.ts
│       ├── services/
│       │   └── agentClient.ts
│       └── types/
│           └── index.ts
└── web-ui/
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public/
    ├── src/
    │   ├── App.css
    │   ├── App.tsx
    │   ├── assets/
    │   ├── components/
    │   │   ├── app-sidebar.tsx
    │   │   ├── nav-main.tsx
    │   │   ├── nav-projects.tsx
    │   │   ├── nav-secondary.tsx
    │   │   ├── nav-user.tsx
    │   │   ├── PrivateRoute.tsx
    │   │   ├── search-form.tsx
    │   │   ├── ui/
    │   │   │   ├── avatar.tsx
    │   │   │   ├── breadcrumb.tsx
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── collapsible.tsx
    │   │   │   ├── dropdown-menu.tsx
    │   │   │   ├── dropzone.tsx
    │   │   │   ├── form.tsx
    │   │   │   └── input.tsx
    │   │   └── version-switcher.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   └── use-mobile.ts
    │   ├── lib/
    │   │   ├── api.ts
    │   │   ├── appNavigationData.ts
    │   │   └── utils.ts
    │   ├── main.tsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── ForgotPassowrd.tsx
    │   │   │   ├── Login.tsx
    │   │   │   └── SignUp.tsx
    │   │   ├── dashboard/
    │   │   │   ├── dashPages/
    │   │   │   │   ├── Challenges/
    │   │   │   │   │   ├── ChallengeDetail.tsx
    │   │   │   │   │   ├── CreateChallenge.tsx
    │   │   │   │   │   └── index.tsx
    │   │   │   │   ├── Models/
    │   │   │   │   ├── Playground/
    │   │   │   │   ├── Settings/
    │   │   │   │   ├── Uploads/
    │   │   │   │   │   ├── NewUpload.tsx
    │   │   │   │   │   └── Uploads.tsx
    │   │   │   │   └── WorkBuddyChats/
    │   │   │   │       └── WorkBuddyChat.tsx
    │   │   │   └── Dashboard.tsx
    │   │   └── Home.tsx
    │   ├── vite-env.d.ts
    └── vite.svg
