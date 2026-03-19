# SDE 3 Interview Prep - Complete Learning Platform 🚀

A comprehensive, all-in-one platform for preparing for **SDE 3 (Senior Software Engineer)** interviews. Master everything from Data Structures & Algorithms to System Design, Low-Level Design, High-Level Design, Agentic AI, and Communication Skills.

## What's Included

✅ **DSA Fundamentals** - Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Sorting & Searching
✅ **System Design** - Scalability, Caching, Databases, Message Queues, Microservices
✅ **Low-Level Design (LLD)** - Design Patterns, OOP Principles, Case Studies  
✅ **High-Level Design (HLD)** - Architecture Patterns, System Architecture, Scalability
✅ **Agentic AI** - AI Frameworks, Fundamentals, Hands-on Projects
✅ **Communication Skills** - Behavioral Questions, Mock Interviews, Storytelling
✅ **Programming Languages** - Java, Python, JavaScript with code examples
✅ **Progress Tracking** - Track your learning journey and maintain consistent streaks
✅ **Search & Discovery** - Find topics quickly across all categories
✅ **Recommended Learning Path** - Curated path from beginner to advanced

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start
```

The server will start at `http://localhost:3000`

### File Structure

```
src/
├── server.ts                 # Main Express server
├── services/
│   ├── contentService.ts    # Content loading and management
│   └── progressService.ts   # Progress tracking
├── dsa/                      # Data Structures & Algorithms
├── system-design/            # System Design materials
├── low-level-design/         # LLD materials
├── high-level-design/        # HLD materials
├── agentic-ai/              # AI-related content
├── communication-skills/     # Interview soft skills
└── languages/               # Language-specific materials

public/
└── index.html               # Main interactive interface

data/
└── progress.json            # User progress tracking (auto-created)
```

## API Endpoints

### Dashboard & Progress
- `GET /api/progress/dashboard` - Get overall progress stats
- `GET /api/learning-path` - Get recommended learning path
- `POST /api/progress/complete` - Mark a topic as completed
- `POST /api/progress/favorite` - Toggle favorite status

### Content
- `GET /api/topics` - Get all available topics
- `GET /api/content/:category/:subtopic` - Get specific content
- `GET /api/search?q=query` - Search across all content
- `GET /api/:category` - Get all topics in a category

### Categories
- `/api/dsa` - Data Structures & Algorithms
- `/api/system-design` - System Design
- `/api/low-level-design` - LLD
- `/api/high-level-design` - HLD  
- `/api/agentic-ai` - Agentic AI
- `/api/communication-skills` - Communication Skills
- `/api/languages` - Programming Languages

## Features

### 📊 Interactive Dashboard
- View overall progress percentage
- Track completion by category
- Maintain learning streaks
- See recommended topics to study next

### 🎯 Personalized Learning Path
- Start with DSA fundamentals
- Progress to design patterns
- Build up to system design
- Master AI systems and communication

### 🔍 Smart Search
- Search across all topics and content
- Find concepts quickly
- Discover related materials

### ⭐ Favorites & Progress
- Mark topics as completed
- Star favorite topics for quick access
- Track what you've learned
- Visualize your progress

### 💾 Local Progress Tracking
- Auto-saved progress in `data/progress.json`
- No external database needed
- Quick startup and offline-capable

## Study Recommendations

### For SDE 3 Preparation (3-6 months)

**Phase 1: Foundations (Weeks 1-6)**
- Master DSA thoroughly
- Practice 50-100 medium/hard problems
- Code in your preferred language (Java, Python, or JavaScript)

**Phase 2: Design Skills (Weeks 7-12)**  
- Study LLD thoroughly with design patterns
- Work through 3-5 LLD design problems
- Understand OOPS principles deeply

**Phase 3: System Design (Weeks 13-21)**
- Learn system design concepts
- Study real-world case studies
- Design 5-7 large-scale systems
- Understand scalability and distributed systems

**Phase 4: Specialized Skills (Weeks 22-26)**
- Agentic AI and modern frameworks
- Polish communication and storytelling
- Practice behavioral interviews
- Mock system design rounds

## How to Use

1. **Start**: Open http://localhost:3000 in your browser
2. **Dashboard**: See your overall progress and tips
3. **Learning Path**: Follow the recommended 7-step learning path
4. **Topics**: Explore all available topics by category
5. **Search**: Find specific topics or concepts quickly
6. **Study**: Click on any topic to view full content
7. **Track**: Mark topics as complete and build your streak
8. **Favorites**: Star important topics for quick reference

## TypeScript Support

The codebase is fully typed with TypeScript. To extend:

```bash
# Watch and recompile
npm run build -- --watch
```

## Development

```bash
# Install dev dependencies
npm install

# Run in development with auto-reload
npm run dev

# Run linter (when configured)
npm run lint
```

## Customization

### Adding New Content
1. Create markdown files in topic directories
2. Service will auto-load content on startup
3. Topics appear instantly in the app

### Extending the API
Edit `src/server.ts` to add new routes

### Customizing the UI
Edit `public/index.html` for styling and layout changes

## Tips for Success

🎯 **Consistency**: Try to learn something every day to build your streak
🔥 **Deep Dive**: Don't just read - code and practice  
📝 **Practice**: Do 50-100 LeetCode problems minimum
🗣️ **Communication**: Practice explaining your solutions verbally
🎤 **Mocks**: Take full mock interviews before applying
📊 **Track**: Monitor your progress and adjust accordingly

## Technologies Used

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: HTML5, CSS3, Vanilla JavaScript  
- **Storage**: JSON files (local)
- **No external dependencies needed** - Lightweight and fast

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Code editor with execution
- [ ] Timed practice problems
- [ ] Video tutorials integration
- [ ] Community discussion forums
- [ ] Custom learning paths
- [ ] Performance analytics
- [ ] Mobile app

## Contributing

Feel free to:
- Add more content to any category
- Improve existing materials
- Add code examples
- Fix errors or clarify concepts

## License

MIT

## Support

For questions or issues, refer to the README in each topic folder or check the comprehensive guides in the `src/theory/` folder.

---

**Good luck with your SDE 3 interview prep! 🚀**

Remember: Consistency > Intensity. Study a little every day, and you'll be well-prepared!
