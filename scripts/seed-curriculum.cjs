/**
 * Idempotent curriculum seeder.
 * - Matches existing topics by (skillSlug, title) — never touches status or existing order.
 * - Enriches existing rows only where fields are NULL.
 * - Creates missing topics with status NOT_STARTED and the next available order.
 * Safe to run repeatedly.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/seed-curriculum.cjs
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

// ─── Curriculum definition ────────────────────────────────────────────────────
// phase: FUNDAMENTALS | INTERMEDIATE | ADVANCED | MASTERY
const CURRICULUM = {
  python: [
    // Existing 15 — enrich only (durations + descriptions), keep titles exact.
    ["Syntax & Variables", "FUNDAMENTALS", 45, "print, comments, variables and naming rules."],
    ["Data Types", "FUNDAMENTALS", 40, "int, float, str, bool and type conversion."],
    ["Conditions", "FUNDAMENTALS", 50, "if / elif / else and comparison operators."],
    ["Loops", "FUNDAMENTALS", 60, "for, while, range, break and continue."],
    ["Functions", "FUNDAMENTALS", 55, "def, parameters, return values and scope."],
    ["Data Structures", "FUNDAMENTALS", 70, "lists, tuples, dicts and sets in practice."],
    ["File Handling", "FUNDAMENTALS", 45, "open, read/write modes and with-blocks."],
    ["Exceptions", "FUNDAMENTALS", 45, "try / except / finally and raising errors."],
    ["Modules", "FUNDAMENTALS", 40, "import, standard library tour, __name__."],
    ["OOP", "FUNDAMENTALS", 80, "classes, objects, methods, inheritance basics."],
    ["Packages", "FUNDAMENTALS", 35, "pip, PyPI and structuring a package."],
    ["Virtual Environments", "FUNDAMENTALS", 30, "venv, why isolation matters."],
    ["APIs", "FUNDAMENTALS", 55, "requests library, GET/POST, JSON responses."],
    ["Testing", "FUNDAMENTALS", 50, "pytest fundamentals and writing testable code."],
    ["Clean Code", "FUNDAMENTALS", 40, "PEP 8, naming, small functions, readability."],
    // New — Intermediate
    ["Comprehensions & Lambdas", "INTERMEDIATE", 45, "list/dict/set comprehensions and anonymous functions."],
    ["Decorators", "INTERMEDIATE", 50, "functions as objects, @decorator syntax, common patterns."],
    ["Generators & Iterators", "INTERMEDIATE", 50, "yield, generator expressions, lazy evaluation."],
    ["Context Managers", "INTERMEDIATE", 35, "with-protocol, __enter__/__exit__, contextlib."],
    ["Working with JSON & CSV", "INTERMEDIATE", 45, "parsing, serialising and real file formats."],
    ["Date & Time Handling", "INTERMEDIATE", 40, "datetime, timedelta, timezones and formatting."],
    ["Regular Expressions", "INTERMEDIATE", 50, "re module: patterns, groups, substitution."],
    ["Logging & Debugging", "INTERMEDIATE", 40, "logging levels, formatters and pdb basics."],
    // New — Advanced
    ["Type Hints & mypy", "ADVANCED", 45, "annotations, Optional, generics, static checks."],
    ["Multithreading & Multiprocessing", "ADVANCED", 60, "GIL, threads vs processes, concurrent.futures."],
    ["Async IO", "ADVANCED", 60, "async/await, event loop, aiohttp basics."],
    ["Metaclasses & Descriptors", "ADVANCED", 50, "how classes really work under the hood."],
    ["Memory Management & Performance", "ADVANCED", 45, "reference counting, gc, profiling tools."],
    // New — Mastery
    ["Project: Command-Line Tool", "MASTERY", 120, "argparse-based CLI utility with packaging."],
    ["Project: Web Scraper", "MASTERY", 150, "requests + BeautifulSoup pipeline to CSV."],
    ["Project: REST API with FastAPI", "MASTERY", 180, "CRUD API with validation and docs."],
    ["Project: Automation Suite", "MASTERY", 150, "automate a real weekly task end-to-end."],
  ],

  git: [
    ["What is Version Control", "FUNDAMENTALS", 25, "why git exists, snapshots vs diffs."],
    ["Install & Configure Git", "FUNDAMENTALS", 20, "git config, identity, editors."],
    ["Repositories: init & clone", "FUNDAMENTALS", 30, "creating and copying repositories."],
    ["Staging & Committing", "FUNDAMENTALS", 40, "add, commit, good messages."],
    ["Viewing History & Diffs", "FUNDAMENTALS", 35, "log, show, diff, blame."],
    ["Ignoring Files", "FUNDAMENTALS", 20, ".gitignore patterns and cache."],
    ["Branching", "INTERMEDIATE", 45, "branch, checkout, switch, HEAD."],
    ["Merging & Conflicts", "INTERMEDIATE", 55, "merge types and resolving conflicts calmly."],
    ["Remotes: push / pull / fetch", "INTERMEDIATE", 45, "origin, upstream, tracking branches."],
    ["GitHub Essentials", "INTERMEDIATE", 40, "repos, issues, stars, profile README."],
    ["Pull Requests & Code Review", "INTERMEDIATE", 50, "PR etiquette, reviews, approvals."],
    ["Tags & Releases", "INTERMEDIATE", 25, "semantic versioning and release pages."],
    ["Rebase vs Merge", "ADVANCED", 50, "history rewriting trade-offs."],
    ["Interactive Rebase", "ADVANCED", 45, "squash, reword, reorder commits."],
    ["Cherry-pick, Revert & Reset", "ADVANCED", 40, "surgical history operations."],
    ["Stash & Worktrees", "ADVANCED", 30, "context switching without losing work."],
    ["Git Hooks", "ADVANCED", 40, "pre-commit automation, husky/lint-staged idea."],
    ["Submodules & Monorepos", "ADVANCED", 40, "managing multiple repos in one."],
    ["Bisect & Reflog Rescue", "ADVANCED", 35, "finding bad commits, recovering 'lost' work."],
    ["Project: Team Workflow Simulation", "MASTERY", 90, "feature-branch flow solo with roles."],
    ["Project: First Open Source PR", "MASTERY", 180, "good-first-issue contribution end-to-end."],
    ["Release Automation Study", "MASTERY", 60, "tags, changelogs and CI releases."],
  ],

  "data-science": [
    ["What is Data Science", "FUNDAMENTALS", 30, "fields, roles and the analysis lifecycle."],
    ["NumPy Fundamentals", "FUNDAMENTALS", 60, "arrays, dtypes, vectorised operations."],
    ["Pandas Series & DataFrames", "FUNDAMENTALS", 75, "indexing, selection, basic ops."],
    ["Loading Data (CSV/Excel/SQL)", "FUNDAMENTALS", 45, "read_* functions and sources."],
    ["Data Cleaning Basics", "FUNDAMENTALS", 60, "dtypes, duplicates, obvious errors."],
    ["Descriptive Statistics", "FUNDAMENTALS", 50, "mean/median/mode, spread, quartiles."],
    ["GroupBy & Aggregation", "INTERMEDIATE", 55, "split-apply-combine pattern."],
    ["Merging & Joining Data", "INTERMEDIATE", 50, "concat, merge, join keys."],
    ["Missing Data Strategies", "INTERMEDIATE", 45, "detect, drop, fill, justify choices."],
    ["Visualization with Matplotlib", "INTERMEDIATE", 60, "line/bar/scatter/hist, subplots."],
    ["Statistical Distributions", "INTERMEDIATE", 50, "normal, skew, sampling intuition."],
    ["Hypothesis Testing", "INTERMEDIATE", 55, "p-values, t-tests, when they mislead."],
    ["EDA Workflow", "INTERMEDIATE", 65, "systematic exploration checklist."],
    ["Seaborn & Statistical Plots", "ADVANCED", 50, "heatmaps, pairplots, styled charts."],
    ["Feature Engineering", "ADVANCED", 60, "encoding, scaling, derived features."],
    ["Time Series Foundations", "ADVANCED", 55, "resampling, rolling windows, seasonality."],
    ["Data from APIs & Scraping", "ADVANCED", 55, "building datasets from the live web."],
    ["Project: End-to-End EDA", "MASTERY", 180, "real dataset, full notebook story."],
    ["Project: Personal Dashboard Data", "MASTERY", 150, "analyse your own app export data."],
    ["Kaggle-Style Competition Entry", "MASTERY", 240, "leaderboard submission workflow."],
  ],

  "web-dev": [
    ["How the Web Works", "FUNDAMENTALS", 30, "clients, servers, HTTP, DNS basics."],
    ["HTML Structure", "FUNDAMENTALS", 40, "elements, attributes, document skeleton."],
    ["HTML Semantics & Forms", "FUNDAMENTALS", 45, "landmarks, inputs, accessibility hooks."],
    ["CSS Selectors & Box Model", "FUNDAMENTALS", 50, "specificity, spacing, sizing."],
    ["Flexbox Layout", "FUNDAMENTALS", 50, "axes, alignment, practical navbars."],
    ["Grid Layout", "FUNDAMENTALS", 45, "tracks, areas, page scaffolding."],
    ["Responsive Design", "FUNDAMENTALS", 45, "media queries, fluid units, mobile-first."],
    ["JavaScript Fundamentals", "FUNDAMENTALS", 60, "variables, types, functions, control flow."],
    ["DOM Manipulation", "FUNDAMENTALS", 50, "query, create, update elements."],
    ["Events & Interaction", "FUNDAMENTALS", 40, "listeners, delegation, forms."],
    ["Modern JS (ES6+)", "INTERMEDIATE", 55, "let/const, arrow fns, destructuring, modules."],
    ["Array Methods Deep Dive", "INTERMEDIATE", 45, "map/filter/reduce fluency."],
    ["Fetch & Working with APIs", "INTERMEDIATE", 50, "promises, JSON, error states."],
    ["Async JavaScript", "INTERMEDIATE", 50, "event loop, async/await patterns."],
    ["Browser Storage", "INTERMEDIATE", 30, "localStorage/sessionStorage use-cases."],
    ["Tailwind CSS", "INTERMEDIATE", 45, "utility-first workflow, design tokens."],
    ["React Fundamentals", "INTERMEDIATE", 60, "components, JSX, rendering model."],
    ["Props & Component Composition", "INTERMEDIATE", 45, "passing data, children patterns."],
    ["State & Event Handling", "INTERMEDIATE", 50, "useState, lifting state, controlled inputs."],
    ["Effects & Hooks", "INTERMEDIATE", 55, "useEffect, custom hook extraction."],
    ["Routing with React Router", "ADVANCED", 45, "nested routes, params, navigation."],
    ["Forms & Validation", "ADVANCED", 45, "uncontrolled vs controlled, schema validation."],
    ["Context & Global State", "ADVANCED", 45, "when context beats prop drilling."],
    ["Next.js Fundamentals", "ADVANCED", 60, "file routing, SSR vs CSR, API routes."],
    ["Server Components & Data Fetching", "ADVANCED", 55, "RSC model, caching behaviour."],
    ["Authentication Patterns", "ADVANCED", 55, "sessions vs JWT, protected routes."],
    ["REST API Design", "ADVANCED", 50, "resources, verbs, status codes."],
    ["Databases & ORMs (Prisma)", "ADVANCED", 60, "schema, migrations, queries."],
    ["Project: Portfolio Website", "MASTERY", 240, "designed, responsive, deployed portfolio."],
    ["Project: Task Manager App", "MASTERY", 300, "CRUD + persistence + polish."],
    ["Project: Full-Stack Mini SaaS", "MASTERY", 480, "auth, DB, payments-style flow."],
    ["Ship It: Production Deploy", "MASTERY", 120, "env vars, build pipeline, monitoring."],
  ],

  ml: [
    ["What is Machine Learning", "FUNDAMENTALS", 30, "learning from data, task taxonomy."],
    ["ML Vocabulary & Workflow", "FUNDAMENTALS", 40, "features, labels, splits, pipelines."],
    ["Supervised vs Unsupervised", "FUNDAMENTALS", 30, "problem framing examples."],
    ["Regression Concepts", "FUNDAMENTALS", 40, "continuous targets, loss intuition."],
    ["Linear Regression Hands-on", "FUNDAMENTALS", 55, "fit, coefficients, residuals."],
    ["Classification Concepts", "FUNDAMENTALS", 40, "decision boundaries, probability outputs."],
    ["Logistic Regression Hands-on", "FUNDAMENTALS", 55, "sigmoid, thresholds, confusion matrix."],
    ["Evaluation Metrics", "FUNDAMENTALS", 50, "accuracy vs precision/recall/F1, ROC."],
    ["Splits & Cross-Validation", "FUNDAMENTALS", 45, "train/val/test, k-fold, leakage."],
    ["Decision Trees", "INTERMEDIATE", 50, "impurity, depth, interpretability."],
    ["Random Forests", "INTERMEDIATE", 45, "bagging, feature importance."],
    ["Gradient Boosting (XGBoost/LightGBM)", "INTERMEDIATE", 60, "boosting mechanics, tuning order."],
    ["Support Vector Machines", "INTERMEDIATE", 45, "margins, kernels, when useful."],
    ["K-Nearest Neighbors", "INTERMEDIATE", 35, "distance metrics, k selection."],
    ["Naive Bayes", "INTERMEDIATE", 35, "probability foundations, text uses."],
    ["Clustering with K-Means", "INTERMEDIATE", 45, "choosing k, silhouette intuition."],
    ["PCA & Dimensionality Reduction", "INTERMEDIATE", 45, "variance, components, visualisation."],
    ["Bias–Variance Tradeoff", "INTERMEDIATE", 40, "underfit vs overfit diagnosis."],
    ["Regularization (L1/L2)", "INTERMEDIATE", 40, "penalties, sparsity, generalisation."],
    ["Neural Nets: The Bridge", "ADVANCED", 45, "from linear models to networks."],
    ["Hyperparameter Tuning", "ADVANCED", 50, "grid/random search, sensible budgets."],
    ["Scikit-learn Pipelines", "ADVANCED", 45, "leak-proof preprocessing chains."],
    ["Imbalanced Data Strategies", "ADVANCED", 40, "resampling, class weights, metrics choice."],
    ["Model Interpretability", "ADVANCED", 50, "permutation importance, SHAP basics."],
    ["Ensemble Strategy", "ADVANCED", 40, "blending, stacking, diversity."],
    ["Project: Tabular Classifier", "MASTERY", 240, "clean end-to-end classification case study."],
    ["Project: Price Predictor", "MASTERY", 240, "regression pipeline with deployment notes."],
    ["Deploy an ML Model", "MASTERY", 180, "serve predictions behind an API."],
    ["Portfolio Case Study Write-up", "MASTERY", 120, "communicate results honestly."],
  ],

  dl: [
    ["What is Deep Learning", "FUNDAMENTALS", 30, "where DL wins, hardware reality."],
    ["Neurons, Layers & Networks", "FUNDAMENTALS", 45, "architecture vocabulary."],
    ["Activation Functions", "FUNDAMENTALS", 35, "ReLU, sigmoid, softmax roles."],
    ["Tensors & PyTorch Basics", "FUNDAMENTALS", 55, "creation, ops, autograd intro."],
    ["Your First Network", "FUNDAMENTALS", 60, "nn.Module forward pass by hand."],
    ["Loss Functions", "FUNDAMENTALS", 35, "MSE vs cross-entropy pairing."],
    ["Optimizers", "FUNDAMENTALS", 35, "SGD vs Adam intuition."],
    ["The Training Loop", "FUNDAMENTALS", 55, "epochs, batches, tracking loss."],
    ["Overfitting & Dropout", "INTERMEDIATE", 45, "diagnose curves, regularise."],
    ["Batch Normalization", "INTERMEDIATE", 35, "stabilising deep training."],
    ["Learning Rate Schedules", "INTERMEDIATE", 35, "step, cosine, warmup."],
    ["CNNs: Convolution & Pooling", "INTERMEDIATE", 50, "filters, receptive fields."],
    ["Image Classification (CIFAR-10)", "INTERMEDIATE", 90, "first real vision model."],
    ["Transfer Learning", "INTERMEDIATE", 60, "pretrained backbones, freezing."],
    ["Data Augmentation", "INTERMEDIATE", 40, "transforms that add free data."],
    ["RNNs & LSTMs", "ADVANCED", 50, "sequences, memory, limitations."],
    ["Word Embeddings", "ADVANCED", 45, "tokens to vectors, similarity."],
    ["Attention Mechanism", "ADVANCED", 55, "queries, keys, values intuition."],
    ["Transformer Architecture", "ADVANCED", 60, "blocks, heads, positional encoding."],
    ["Hugging Face Ecosystem", "ADVANCED", 50, "models, tokenizers, datasets."],
    ["Fine-tuning Pretrained Models", "ADVANCED", 75, "small-data transfer done right."],
    ["Practical GPU Training", "ADVANCED", 45, "mixed precision, batch sizing, OOM triage."],
    ["Project: Image Classifier", "MASTERY", 240, "custom dataset → deployed demo."],
    ["Project: Sentiment Analyzer", "MASTERY", 240, "text pipeline with transformer backbone."],
    ["Project: Fine-tune a Small LLM", "MASTERY", 360, "instruction-tuning walkthrough."],
    ["Capstone: Multi-modal Demo", "MASTERY", 420, "combine vision + text end-to-end."],
  ],
};

const PHASE_ORDER = { FUNDAMENTALS: 0, INTERMEDIATE: 1, ADVANCED: 2, MASTERY: 3 };

(async () => {
  const skills = await db.skill.findMany({ select: { id: true, slug: true } });
  const skillBySlug = new Map(skills.map((s) => [s.slug, s.id]));

  const report = [];
  let createdTotal = 0;
  let enrichedTotal = 0;

  for (const [slug, entries] of Object.entries(CURRICULUM)) {
    const skillId = skillBySlug.get(slug);
    if (!skillId) {
      report.push(`${slug}: SKILL NOT FOUND — skipped`);
      continue;
    }
    const existing = await db.topic.findMany({
      where: { skillId },
      select: { id: true, title: true, phase: true, order: true, status: true },
    });
    const byTitle = new Map(existing.map((t) => [t.title.toLowerCase(), t]));
    let nextOrder = existing.reduce((m, t) => Math.max(m, t.order ?? 0), 0);
    let created = 0;
    let enriched = 0;

    for (const [title, phase, durationMins, description] of entries) {
      const found = byTitle.get(title.toLowerCase());
      if (found) {
        const patch = {};
        if (found.phase !== phase && PHASE_ORDER[phase] > PHASE_ORDER[found.phase]) patch.phase = phase;
        const current = await db.topic.findUnique({ where: { id: found.id }, select: { durationMins: true, description: true } });
        if (current && current.durationMins == null) patch.durationMins = durationMins;
        if (current && !current.description) patch.description = description;
        if (Object.keys(patch).length > 0) {
          await db.topic.update({ where: { id: found.id }, data: patch });
          enriched++;
        }
      } else {
        nextOrder += 1;
        await db.topic.create({
          data: { skillId, title, phase, order: nextOrder, durationMins, description, status: "NOT_STARTED" },
        });
        created++;
      }
    }

    const finalCount = await db.topic.count({ where: { skillId } });
    createdTotal += created;
    enrichedTotal += enriched;
    report.push(`${slug}: created=${created} enriched=${enriched} total=${finalCount}`);
  }

  console.log(report.join("\n"));
  console.log(`DONE — created=${createdTotal}, enriched=${enrichedTotal}`);
  await db.$disconnect();
})().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
