# Pierre Gallet Portfolio Site - V2 Roadmap

## DESIGN VISION

**Inspiration:** [webild.io](https://www.webild.io/) single-scroll landing page
**Core Concept:** AI chatbot as hero element that transforms into persistent companion

### Design Aesthetic
- White/light base background
- Blue accent colors (primary CTA, links, highlights)
- Gradient text for headlines
- Glassmorphism cards with frosted glass effect
- Subtle shadows and depth
- Clean, modern typography
- Smooth scroll animations

---

## THE CHATBOT ARCHITECTURE

### The Challenge You Asked About

> "Should it be a floating widget or something else in order to fully function as described?"

### The Solution: Single Component, Two States

**One chatbot component** with **CSS-driven state transitions:**

```
┌─────────────────────────────────────────────────────────────┐
│                      HERO STATE                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │     "Ask me anything about Pierre Gallet"           │   │
│  │                                                       │   │
│  │     ┌─────────────────────────────────────────┐     │   │
│  │     │  Type your question...              🔍  │     │   │
│  │     └─────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │     💡 Suggested: "What has Pierre built?"          │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  User visible: Full-width, centered, glassmorphism card    │
│  CSS: position: relative; max-width: 800px; margin: auto;  │
└─────────────────────────────────────────────────────────────┘

                    ↓ User scrolls past hero ↓

┌─────────────────────────────────────────────────────────────┐
│                     PAGE CONTENT                            │
│                                                             │
│     [About Section]                                        │
│     [Projects Section]                                     │
│     [Qualifications Section]                               │
│     [Contact Section]                                      │
│                                                             │
│                              ┌──────────────────────┐      │
│                              │  🤖 Chat with Pierre │      │
│                              │  ┌────────────────┐  │      │
│                              │  │ conversation...│  │      │
│                              │  └────────────────┘  │      │
│                              │  Type here...        │      │
│                              └──────────────────────┘      │
│                                                             │
│  User visible: Compact widget, bottom-right, always there  │
│  CSS: position: fixed; bottom: 24px; right: 24px;          │
└─────────────────────────────────────────────────────────────┘
```

### Technical Implementation

```jsx
// React component (for Astro, use client:load)
const ChatBot = () => {
  const [isHeroMode, setIsHeroMode] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    // Intersection Observer detects when hero leaves viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroMode(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Invisible marker for hero section */}
      <div ref={heroRef} className="hero-marker" />
      
      {/* Single chat component with dynamic classes */}
      <div className={`
        chat-container
        transition-all duration-500 ease-in-out
        ${isHeroMode 
          ? 'hero-chat relative w-full max-w-3xl mx-auto' 
          : 'widget-chat fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl'
        }
      `}>
        <ChatInterface />
      </div>
    </>
  );
};
```

### Key Points:
1. **Single source of truth** - One component, conversation persists
2. **CSS handles the magic** - `position: relative` → `position: fixed`
3. **Smooth transition** - `transition-all duration-500`
4. **Intersection Observer** - Detects scroll position efficiently
5. **Z-index management** - Widget state needs `z-50` to float above content

---

## NAVIGATION-AWARE CHATBOT

### How the Chatbot Navigates Users

The chatbot should:
1. **Answer the question** from RAG databases
2. **Navigate to relevant section** on the page
3. **Highlight** or draw attention to that section

### Implementation Approach

```javascript
// Custom action handler in chat component
const handleChatResponse = (response) => {
  // 1. Display the RAG-powered answer
  displayMessage(response.text);
  
  // 2. Check if response includes navigation intent
  if (response.navigateTo) {
    // Smooth scroll to section
    const section = document.getElementById(response.navigateTo);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Optional: Add highlight animation
      section.classList.add('highlight-pulse');
      setTimeout(() => section.classList.remove('highlight-pulse'), 2000);
    }
  }
};
```

### Agent System Prompt Addition

Add navigation instructions to the RAG agent:

```
<navigation_rules>
When answering questions, include a navigation intent in your response metadata:

- Questions about qualifications/certifications → navigateTo: "qualifications"
- Questions about projects/what Pierre built → navigateTo: "projects"  
- Questions about background/experience → navigateTo: "about"
- Questions about contact/hiring → navigateTo: "contact"

Format: Include JSON at end of response: {"navigateTo": "section-id"}
</navigation_rules>
```

### Alternative: Keyword-Based Navigation

If modifying the agent is complex, use client-side keyword detection:

```javascript
const detectNavigationIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('qualif') || lowerMessage.includes('certif') || 
      lowerMessage.includes('education')) {
    return 'qualifications';
  }
  if (lowerMessage.includes('built') || lowerMessage.includes('project') || 
      lowerMessage.includes('portfolio')) {
    return 'projects';
  }
  if (lowerMessage.includes('background') || lowerMessage.includes('about') || 
      lowerMessage.includes('experience')) {
    return 'about';
  }
  if (lowerMessage.includes('contact') || lowerMessage.includes('hire') || 
      lowerMessage.includes('email')) {
    return 'contact';
  }
  
  return null;
};
```

---

## PAGE SECTIONS

### Section 1: Hero (Above Fold)

```
┌─────────────────────────────────────────────────────────────┐
│  [P logo]                         [GitHub] [LinkedIn] [CTA] │
│─────────────────────────────────────────────────────────────│
│                                                             │
│              ╭───────────────────────────────╮              │
│              │                               │              │
│              │   "Ask me anything about      │              │
│              │    Pierre Gallet"             │              │
│              │                               │              │
│              │   ┌─────────────────────┐     │              │
│              │   │ What would you      │     │              │
│              │   │ like to know?   🔍  │     │              │
│              │   └─────────────────────┘     │              │
│              │                               │              │
│              │   Suggested questions:        │              │
│              │   • What has Pierre built?    │              │
│              │   • What's his background?    │              │
│              │   • What skills does he have? │              │
│              │                               │              │
│              ╰───────────────────────────────╯              │
│                      (glassmorphism card)                   │
│                                                             │
│                         ↓ Scroll                            │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Floating header (fixed on scroll)
- Gradient or subtle background
- Glassmorphism chat card as centerpiece
- Suggested questions as clickable chips
- Scroll indicator

---

### Section 2: About

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ABOUT                                                      │
│  ─────                                                      │
│                                                             │
│  ┌────────────┐                                             │
│  │            │   Pierre Gallet                             │
│  │   Photo    │   AI Implementation Specialist              │
│  │            │                                             │
│  └────────────┘   18 years translating complex solutions    │
│                   into business value. Based in Cape Town.  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ The short version: I've spent nearly two decades     │   │
│  │ helping organizations implement complex solutions.   │   │
│  │ Now I'm focused on AI—not just the technology, but   │   │
│  │ making it actually work for real businesses.         │   │
│  │                                                       │   │
│  │ I believe AI adoption fails not because of           │   │
│  │ technical limitations, but because of human factors. │   │
│  └─────────────────────────────────────────────────────┘   │
│                      (glassmorphism card)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Content:**
- Brief bio (not full CV)
- Philosophy statement
- Photo (optional)
- Key stats: 18 years experience, Cape Town based

---

### Section 3: Projects / Portfolio

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  WHAT I'VE BUILT                                            │
│  ───────────────                                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │  │              │      │
│  │  SOTA RAG    │  │  Obsidian    │  │    VPS       │      │
│  │  System      │  │  MCP Server  │  │  Infra       │      │
│  │              │  │              │  │              │      │
│  │  Hybrid RAG  │  │  13+ stars   │  │  Docker      │      │
│  │  132 nodes   │  │  on Glama    │  │  Stack       │      │
│  │              │  │              │  │              │      │
│  │   [View →]   │  │   [View →]   │  │   [View →]   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│     (glassmorphism cards with hover effects)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LEGACY WORK (Brand Iron)                             │  │
│  │                                                        │  │
│  │  • UNHCR Environmental Branding                       │  │
│  │  • RCL Foods HQ - 90,000 Wooden Spoons Installation  │  │
│  │  • COP17 Climate Conference                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Projects to Feature:**

| Project | Highlights | Links |
|---------|------------|-------|
| SOTA RAG v2.3.2 | Hybrid architecture, 132 nodes, smart chunking | Architecture diagram |
| Obsidian-MCP | Published on Glama, 13 stars, MIT license | GitHub, Glama |
| VPS Infrastructure | Full Docker stack, production AI services | Architecture diagram |
| Portfolio Chatbot | "You're using it right now" meta-demo | — |

**Legacy Section:**
- Brief mention of Brand Iron work
- Demonstrates delivery experience
- Photos if available

---

### Section 4: Qualifications

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  QUALIFICATIONS                                             │
│  ──────────────                                             │
│                                                             │
│  Currently Pursuing                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎓 MIT Applied Agentic AI                           │   │
│  │    via GetSmarter | Completing Feb 2026             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Completed                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ IBM AI Eng  │  │ Prompt Eng  │  │ UCT Project │        │
│  │ Certificate │  │ Bootcamp    │  │ Management  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Elements    │  │ Red+Yellow  │  │ Durban UT   │        │
│  │ of AI       │  │ Account Mgmt│  │ Design Dip  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Skills                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ RAG Systems • n8n • Python • Docker • Neo4j        │   │
│  │ Knowledge Graphs • MCP Protocol • Client Delivery   │   │
│  │ Project Management • Stakeholder Communication      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Content:**
- Current education (MIT program)
- Completed certifications
- Technical skills
- Business skills
- Timeline or progress indicators

---

### Section 5: Contact / CTA

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LET'S CONNECT                                              │
│  ─────────────                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │   Interested in working together?                    │   │
│  │                                                       │   │
│  │   📧 user@example.com                          │   │
│  │   📍 Cape Town, South Africa                         │   │
│  │                                                       │   │
│  │   ┌────────────────────────────────────────┐        │   │
│  │   │         Contact Me                      │        │   │
│  │   └────────────────────────────────────────┘        │   │
│  │                                                       │   │
│  │   [GitHub]  [LinkedIn]                               │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                      (glassmorphism card)                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                    © 2025 Pierre Gallet                     │
└─────────────────────────────────────────────────────────────┘
```

---

## NAVIGATION HEADER

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [P logo]           About  Projects  Qualifications        │
│                                                             │
│                                       [GitHub] [Li] [CTA]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

States:
- At top: transparent background
- On scroll: white/frosted glass background, slight shadow
- Fixed position throughout
```

**Elements:**
- Logo/name on left
- Section links (smooth scroll)
- Social links (GitHub, LinkedIn) on right
- CTA button "Contact Me" with accent color

---

## CSS DESIGN SYSTEM

### Color Palette

```css
:root {
  /* Base */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  
  /* Accent - Blue */
  --accent-primary: #3b82f6;
  --accent-secondary: #60a5fa;
  --accent-light: #dbeafe;
  
  /* Gradient */
  --gradient-text: linear-gradient(135deg, #3b82f6, #8b5cf6);
  --gradient-bg: linear-gradient(135deg, #eff6ff, #f5f3ff);
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-blur: 12px;
}
```

### Glassmorphism Card

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
```

### Gradient Text

```css
.gradient-text {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Chat Widget Transition

```css
.chat-container {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-chat {
  position: relative;
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
}

.widget-chat {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 24rem;
  height: 500px;
  z-index: 50;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

---

## TECH STACK

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | **Astro** | Static generation, fast, islands architecture |
| Styling | **Tailwind CSS** | Rapid development, design system consistency |
| Chat UI | **Custom React component** | Full control over state transitions |
| Chat Backend | **n8n Chat Trigger** | Already built, connects to RAG system |
| Animations | **CSS transitions** + **Intersection Observer** | Smooth, performant |
| Deployment | **VPS Docker** | Existing infrastructure |

---

## IMPLEMENTATION PHASES

### Phase 1: Chat Component Development (Priority)

**Goal:** Single chat component that transitions hero → widget

1. Create React component with Intersection Observer
2. Style both states (hero centered, widget fixed)
3. Test transition animation
4. Integrate n8n chat API
5. Test on local dev server

**Files:**
```
src/components/
├── ChatBot.tsx           # Main component with state logic
├── ChatInterface.tsx     # The actual chat UI
└── ChatMessage.tsx       # Individual message component
```

### Phase 2: Page Structure & Navigation

**Goal:** Single-scroll page with sections

1. Create Astro layout with fixed header
2. Implement section components
3. Add smooth scroll navigation
4. Style header transparency → solid on scroll
5. Add mobile hamburger menu

**Files:**
```
src/
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   └── index.astro       # Single page with all sections
└── components/
    ├── Header.astro
    ├── HeroSection.astro
    ├── AboutSection.astro
    ├── ProjectsSection.astro
    ├── QualificationsSection.astro
    └── ContactSection.astro
```

### Phase 3: Content & Polish

**Goal:** Populate with real content, refine design

1. Add project cards with real content
2. Add qualification badges
3. Import photos/images
4. Test responsive design
5. Optimize performance
6. Add subtle animations

### Phase 4: Navigation Intelligence

**Goal:** Chatbot navigates users to sections

1. Implement scroll-to-section function
2. Add section highlighting on navigation
3. Either:
   - Modify agent to return navigation intent, OR
   - Add client-side keyword detection
4. Test end-to-end flow

### Phase 5: Deploy

**Goal:** Live on VPS

1. Build Astro static site
2. Docker container setup
3. Nginx configuration
4. SSL certificate
5. DNS configuration
6. Final testing

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
.chat-hero { width: 100%; padding: 1rem; }
.section { padding: 4rem 1rem; }

/* Tablet */
@media (min-width: 768px) {
  .chat-hero { max-width: 600px; }
  .section { padding: 6rem 2rem; }
}

/* Desktop */
@media (min-width: 1024px) {
  .chat-hero { max-width: 800px; }
  .section { padding: 8rem 4rem; }
}

/* Widget on mobile */
@media (max-width: 640px) {
  .widget-chat {
    width: calc(100% - 2rem);
    left: 1rem;
    right: 1rem;
  }
}
```

---

## ACCESSIBILITY CONSIDERATIONS

1. **Chat widget:**
   - `aria-live` for new messages
   - `role="dialog"` when in widget mode
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus trap when widget is open

2. **Navigation:**
   - Skip to main content link
   - Semantic heading hierarchy
   - Focus indicators on interactive elements

3. **Glassmorphism:**
   - Sufficient contrast ratios (WCAG AA)
   - Don't rely solely on blur for element boundaries
   - Test with "Reduce Transparency" OS setting

---

## QUESTIONS RESOLVED

| Question | Answer |
|----------|--------|
| Floating widget or something else? | Single component with two CSS states (relative → fixed) using Intersection Observer |
| How to navigate to sections? | Smooth scroll + optional highlight animation |
| What sections? | Hero (chat), About, Projects, Qualifications, Contact |
| How does chat know where to navigate? | Either agent-driven (metadata) or client-side keyword detection |

---

## FILES TO CREATE

```
pierre-portfolio/
├── src/
│   ├── components/
│   │   ├── ChatBot.tsx              # Hero → Widget transition
│   │   ├── ChatInterface.tsx        # Chat UI
│   │   ├── Header.astro             # Fixed nav
│   │   ├── HeroSection.astro        # Chat as hero
│   │   ├── AboutSection.astro       # Bio section
│   │   ├── ProjectCard.astro        # Project display
│   │   ├── ProjectsSection.astro    # All projects
│   │   ├── QualificationBadge.astro # Cert display
│   │   ├── QualificationsSection.astro
│   │   └── ContactSection.astro     # CTA + footer
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro              # Single scroll page
│   └── styles/
│       └── global.css               # Design system
├── public/
│   └── images/                      # Photos, diagrams
├── tailwind.config.mjs
├── astro.config.mjs
├── Dockerfile
└── package.json
```

---

## TIMELINE

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1 | Chat component (hero → widget) | 4-6 hours |
| 2 | Page structure & navigation | 3-4 hours |
| 3 | Content & polish | 4-6 hours |
| 4 | Navigation intelligence | 2-3 hours |
| 5 | Deploy | 2-3 hours |

**Total: ~15-22 hours**

**Deadline:** January 19, 2026
**Target:** January 16, 2026 (3-day buffer)

---

## DEPENDENCIES

Before building the site:

1. **RAG content ingestion** (see `portfolio-content/ACTION_PLAN.md`)
   - Google Sheet with structured facts
   - Markdown docs for narrative content
   - Agent routing optimized

2. **Chat endpoint tested and fast**
   - Response time acceptable
   - Quality answers about Pierre

---

## SUCCESS CRITERIA

### Must Have
- [ ] Chat as hero, transitions to widget on scroll
- [ ] All sections render correctly
- [ ] Smooth scroll navigation works
- [ ] Mobile responsive
- [ ] Deployed to public URL

### Should Have
- [ ] Chatbot navigates to relevant sections
- [ ] Glassmorphism styling consistent
- [ ] Fast load times (<3s)
- [ ] Professional polish

### Nice to Have
- [ ] Section highlighting when chat navigates
- [ ] Dark mode toggle
- [ ] Architecture diagrams in projects
- [ ] Subtle scroll animations

---

## NEXT STEPS

1. ✅ Create V2 Roadmap (this document)
2. 🔲 Complete RAG content preparation (`portfolio-content/ACTION_PLAN.md`)
3. 🔲 Initialize Astro project
4. 🔲 Build ChatBot component with state transitions
5. 🔲 Test chat in isolation before integrating
6. 🔲 Build page sections
7. 🔲 Deploy and test
