(function () {
  "use strict";

  var PORTFOLIO = {
    name: "Rakshith Reddy Aredla",
    location: "Hyderabad, India",
    role: "Full-Stack + AI Developer",
    featured: [
      {
        index: "01",
        title: "Arkaira",
        glyph: "🌸",
        description:
          "Online flower shop with realtime stock, Razorpay checkout and an admin dashboard — stock decrements the moment someone pays. A production-grade full-stack build with a live deployment.",
        tags: ["Next.js", "Supabase", "Razorpay", "TypeScript"],
        url: "https://github.com/rakshithreddy-aredla/Arkaira",
        demo: "https://arkaira.vercel.app",
      },
      {
        index: "02",
        title: "Netra",
        glyph: "🚗",
        description:
          "Real-time AI driver drowsiness & distraction detection running on-device — React Native + ML Kit. Alert-level safety monitoring that works without a server.",
        tags: ["React Native", "ML Kit", "On-device AI", "TypeScript"],
        url: "https://github.com/rakshithreddy-aredla/Netra",
      },
      {
        index: "03",
        title: "RecallDesk",
        glyph: "🧠",
        description:
          "A support copilot that remembers. When a customer comes back saying 'it's broken again', the agent already knows which ticket it was and what fixed it last time.",
        tags: ["LLM", "Retrieval", "Agent Memory"],
        url: "https://github.com/rakshithreddy-aredla/recalldesk",
      },
      {
        index: "04",
        title: "Anchor",
        glyph: "🫶",
        description:
          "Memory-powered health navigator for family caregivers — meds, labs and doctor's instructions in one place, so you're not reconstructing three months of history mid-visit.",
        tags: ["FastAPI", "Streamlit", "LLM", "Memory"],
        url: "https://github.com/rakshithreddy-aredla/anchor-caregiver-memory",
      },
      {
        index: "05",
        title: "CascadeGuard",
        glyph: "📡",
        description:
          "RAG pipeline monitoring — an implementation of a published paper. Observability for retrieval pipelines: trace every stage, catch silent failures before users do.",
        tags: ["RAG", "Observability", "Paper implementation", "Python"],
        url: "https://github.com/rakshithreddy-aredla/rag-pipeline-monitor",
      },
      {
        index: "06",
        title: "GitGlance",
        glyph: "🔎",
        description:
          "CLI that scores any GitHub profile the way a selection committee would, and tells you what to fix — transparency over vibes, zero dependencies. Built to hack hackathon-readiness.",
        tags: ["Python", "CLI", "GitHub API"],
        url: "https://github.com/rakshithreddy-aredla/GitGlance",
      },
    ],
    more: [
      {
        title: "EnvGuard",
        description: "Fail-fast, zero-dependency env var validation for Node — schema in, typed config out.",
        tags: ["TypeScript", "Node.js"],
        url: "https://github.com/rakshithreddy-aredla/EnvGuard",
      },
      {
        title: "SpamScope",
        description: "Naive Bayes spam classifier written by hand — no sklearn, no numpy. Laplace smoothing, log-space inference, full metrics.",
        tags: ["Python", "ML"],
        url: "https://github.com/rakshithreddy-aredla/SpamScope",
      },
      {
        title: "SMS Spam Classifier",
        description: "TF-IDF + Naive Bayes on the UCI dataset — ~97% accuracy. Classical NLP, measured properly.",
        tags: ["Python", "TF-IDF", "Naive Bayes"],
        url: "https://github.com/rakshithreddy-aredla/spam-classifier",
      },
      {
        title: "Digit CNN",
        description: "CNN on MNIST with a full PyTorch pipeline — ~99% test accuracy.",
        tags: ["Python", "PyTorch", "CV"],
        url: "https://github.com/rakshithreddy-aredla/handwritten-digit-cnn",
      },
      {
        title: "Netra Prototype",
        description: "Earlier prototype of Netra — AI driver safety with drowsiness, yawn and distraction detection.",
        tags: ["React Native", "ML Kit"],
        url: "https://github.com/rakshithreddy-aredla/netra-driver-guardian",
      },
      {
        title: "RAG Chatbot",
        description: "Retrieval-Augmented Generation chatbot — answers questions from your own documents with citations and a live browser UI.",
        tags: ["Python", "Flask", "RAG", "LLM"],
        url: "https://github.com/rakshithreddy-aredla/ai-chatbot-rag",
      },
      {
        title: "House Price Predictor",
        description: "House price regression with Random Forest and feature engineering — R² ≈ 0.80.",
        tags: ["Python", "ML"],
        url: "https://github.com/rakshithreddy-aredla/house-price-predictor",
      },
      {
        title: "Movie Recommender",
        description: "Recommendation engine experiment.",
        tags: ["Python", "ML"],
        url: "https://github.com/rakshithreddy-aredla/movie-recommender",
      },
      {
        title: "Iris Classifier",
        description: "Classic iris classification, clean and readable.",
        tags: ["Python", "ML"],
        url: "https://github.com/rakshithreddy-aredla/iris-classifier",
      },
    ],
    skills: [
      "TypeScript", "JavaScript", "Python", "Next.js", "Node.js", "FastAPI",
      "Flask", "PyTorch", "React Native", "ML Kit", "Supabase", "Postgres",
      "Razorpay API", "Streamlit", "Tailwind CSS", "Git", "GitHub Actions", "Vercel",
    ],
    stats: { repos: "18", models: "99%", stack: "5" },
    timeline: [
      {
        date: "The beginning",
        title: "First website & first Python",
        desc: "My first HTML/CSS about-me page and the classic number guessing game. Where it all started.",
      },
      {
        date: "AI / ML deep dive",
        title: "Learning the shape of the problem",
        desc: "Worked through ML end-to-end: CNN on MNIST (~99%), RAG chatbot, house-price regression, iris classification, movie recommender.",
      },
      {
        date: "2026",
        title: "Shipping full-stack products",
        desc: "Arkaira (live e-commerce with realtime stock + Razorpay), EnvGuard (typed env validation), GitGlance (GitHub profile scorer).",
      },
      {
        date: "2026",
        title: "HackWithHyderabad 3.0",
        desc: "Built and shipped under hackathon pressure — participated in HackWithHyderabad 3.0.",
      },
      {
        date: "2026",
        title: "Agent memory & RAG",
        desc: "RecallDesk (support copilot that remembers), Anchor (caregiver memory), CascadeGuard (RAG pipeline monitoring, published-paper implementation).",
      },
    ],
  };

  function featuredMarkup(project, isAlt) {
    var altClass = isAlt ? " project-card--alt" : "";
    var links =
      '<a class="project__link" href="' + project.url + '" target="_blank" rel="noopener">View code ↗</a>' +
      (project.demo
        ? '<a class="project__link" href="' + project.demo + '" target="_blank" rel="noopener">Live demo ↗</a>'
        : "");
    return (
      '<article class="project-card' + altClass + '">' +
      '<div class="project__visual" data-glyph="' + project.glyph + '"><span class="project__visual-glyph">' + project.glyph + "</span></div>" +
      '<div class="project__body">' +
      '<span class="project__index">' + project.index + "</span>" +
      '<h3 class="project__title">' + project.title + "</h3>" +
      '<p class="project__desc">' + project.description + "</p>" +
      '<div class="project__tags">' +
      project.tags.map(function (tag) { return '<span class="tag">' + tag + "</span>"; }).join("") +
      "</div>" +
      '<div class="project__links">' + links + "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function moreMarkup(project) {
    return (
      '<a class="more-card" href="' + project.url + '" target="_blank" rel="noopener">' +
      '<h4 class="more-card__title">' + project.title + "</h4>" +
      '<p class="more-card__desc">' + project.description + "</p>" +
      '<div class="more-card__tags">' +
      project.tags.map(function (tag) { return '<span class="tag">' + tag + "</span>"; }).join("") +
      "</div>" +
      "</a>"
    );
  }

  function skillMarkup(skill) {
    return '<span class="skill">' + skill + "</span>";
  }

  function timelineMarkup(item) {
    return (
      '<div class="timeline-item">' +
      '<span class="timeline-item__date">' + item.date + "</span>" +
      '<h3 class="timeline-item__title">' + item.title + "</h3>" +
      '<p class="timeline-item__desc">' + item.desc + "</p>" +
      "</div>"
    );
  }

  var featuredEl = document.getElementById("featured-projects");
  if (featuredEl) {
    featuredEl.innerHTML = PORTFOLIO.featured
      .map(function (project, i) { return featuredMarkup(project, i % 2 === 1); })
      .join("");
  }

  var moreEl = document.getElementById("more-projects");
  if (moreEl) {
    moreEl.innerHTML = PORTFOLIO.more.map(moreMarkup).join("");
  }

  var skillsEl = document.getElementById("skills-list");
  if (skillsEl) {
    skillsEl.innerHTML = PORTFOLIO.skills.map(skillMarkup).join("");
  }

  var timelineEl = document.getElementById("timeline");
  if (timelineEl) {
    timelineEl.innerHTML = PORTFOLIO.timeline.map(timelineMarkup).join("");
  }

  var statRepos = document.getElementById("stat-repos");
  if (statRepos) statRepos.textContent = PORTFOLIO.stats.repos;
  var statModels = document.getElementById("stat-models");
  if (statModels) statModels.textContent = PORTFOLIO.stats.models;
  var statStack = document.getElementById("stat-stack");
  if (statStack) statStack.textContent = PORTFOLIO.stats.stack;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  window.PORTFOLIO = PORTFOLIO;
})();
