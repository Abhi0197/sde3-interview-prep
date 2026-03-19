import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { contentService } from './services/contentService';
import { progressService } from './services/progressService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize services
contentService.initialize();
progressService.initialize();

// ============== API ROUTES ==============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all topics/modules
app.get('/api/topics', (req, res) => {
    try {
        const topics = contentService.getAllTopics();
        res.json({ success: true, data: topics });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get content for a specific topic
app.get('/api/content/:category/:subtopic', (req, res) => {
    try {
        const { category, subtopic } = req.params;
        const content = contentService.getContent(category, subtopic);
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }
        res.json({ success: true, data: content });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search across all content
app.get('/api/search', (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query parameter required' });
        }
        const results = contentService.search(query);
        res.json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all DSA topics
app.get('/api/dsa', (req, res) => {
    try {
        const dsa = contentService.getByCategory('dsa');
        res.json({ success: true, data: dsa });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all System Design topics
app.get('/api/system-design', (req, res) => {
    try {
        const sd = contentService.getByCategory('system-design');
        res.json({ success: true, data: sd });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all LLD topics
app.get('/api/low-level-design', (req, res) => {
    try {
        const lld = contentService.getByCategory('low-level-design');
        res.json({ success: true, data: lld });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all HLD topics
app.get('/api/high-level-design', (req, res) => {
    try {
        const hld = contentService.getByCategory('high-level-design');
        res.json({ success: true, data: hld });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all Agentic AI topics
app.get('/api/agentic-ai', (req, res) => {
    try {
        const ai = contentService.getByCategory('agentic-ai');
        res.json({ success: true, data: ai });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all Communication Skills
app.get('/api/communication-skills', (req, res) => {
    try {
        const comm = contentService.getByCategory('communication-skills');
        res.json({ success: true, data: comm });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all Languages
app.get('/api/languages', (req, res) => {
    try {
        const langs = contentService.getByCategory('languages');
        res.json({ success: true, data: langs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get topics for a specific category (with subcategory)
app.get('/api/categories/:category/:subcategory', (req, res) => {
    try {
        const { category, subcategory } = req.params;
        const fullCategory = `${category}/${subcategory}`;
        
        // Get all topics and filter by the full category path
        const allTopics = contentService.getAllTopics();
        let topics: any[] = [];
        
        // Find topics that match this category/subcategory
        const categoryData = contentService.getByCategory(category);
        if (categoryData && categoryData.subtopics) {
            const matchingSubtopic = categoryData.subtopics.find((st: any) => st.id === subcategory);
            if (matchingSubtopic) {
                // Return the subtopic with its metadata
                topics.push({
                    category: category,
                    subtopic: subcategory,
                    name: matchingSubtopic.name,
                    description: `Complete guide to ${matchingSubtopic.name}`,
                    difficulty: matchingSubtopic.difficulty,
                    estimatedTime: '2-3 hours',
                    type: matchingSubtopic.type
                });
            }
        }
        
        res.json({ success: true, data: topics });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============== USER MANAGEMENT ==============

// Get all users
app.get('/api/users', (req, res) => {
    try {
        const users = progressService.getAllUsers();
        const userInfo = users.map(username => progressService.getUserInfo(username));
        res.json({ success: true, data: userInfo });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user info
app.get('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        const info = progressService.getUserInfo(username);
        res.json({ success: true, data: info });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete user
app.delete('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        const success = progressService.deleteUser(username);
        if (success) {
            res.json({ success: true, message: `User ${username} deleted` });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============== PROGRESS ENDPOINTS (MULTI-USER) ==============

// Get learning dashboard/stats
app.get('/api/progress/dashboard', (req, res) => {
    try {
        const username = req.query.username as string || 'default-user';
        const stats = progressService.getDashboardStats(username);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark topic as completed
app.post('/api/progress/complete', (req, res) => {
    try {
        const { username, category, subtopic, language } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        progressService.markAsCompleted(username, category, subtopic, language);
        res.json({ success: true, message: 'Progress updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add to favorites
app.post('/api/progress/favorite', (req, res) => {
    try {
        const { username, category, subtopic } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        progressService.toggleFavorite(username, category, subtopic);
        res.json({ success: true, message: 'Favorite updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get personalized learning path
app.get('/api/learning-path', (req, res) => {
    try {
        const username = req.query.username as string || 'default-user';
        const path = progressService.getRecommendedLearningPath(username);
        res.json({ success: true, data: path });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve the main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n🚀 SDE 3 Interview Prep Server is running!`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`🔗 API docs available at http://localhost:${PORT}/api/health\n`);
});

export default app;
