import fs from 'fs';
import path from 'path';

interface UserProgress {
    completed: Set<string>;
    favorites: Set<string>;
    streak: number;
    lastUpdated: string;
}

interface DashboardStats {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    streak: number;
    byCategory: {
        [key: string]: {
            name: string;
            total: number;
            completed: number;
            percentage: number;
        };
    };
}

class ProgressService {
    private progress: UserProgress;
    private progressFile: string;

    constructor() {
        this.progressFile = path.join(__dirname, '../../data/progress.json');
        this.progress = {
            completed: new Set(),
            favorites: new Set(),
            streak: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    initialize() {
        try {
            this.ensureDataDir();
            this.loadProgress();
            console.log('✓ Progress service initialized');
        } catch (error) {
            console.error('Error initializing progress service:', error);
        }
    }

    private ensureDataDir() {
        const dataDir = path.dirname(this.progressFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    private loadProgress() {
        try {
            if (fs.existsSync(this.progressFile)) {
                const data = JSON.parse(fs.readFileSync(this.progressFile, 'utf-8'));
                this.progress.completed = new Set(data.completed || []);
                this.progress.favorites = new Set(data.favorites || []);
                this.progress.streak = data.streak || 0;
                this.progress.lastUpdated = data.lastUpdated || new Date().toISOString();
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    private saveProgress() {
        try {
            this.ensureDataDir();
            const data = {
                completed: Array.from(this.progress.completed),
                favorites: Array.from(this.progress.favorites),
                streak: this.progress.streak,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.progressFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    markAsCompleted(category: string, subtopic: string, language?: string) {
        const key = language ? `${category}/${subtopic}/${language}` : `${category}/${subtopic}`;
        this.progress.completed.add(key);
        this.updateStreak();
        this.saveProgress();
    }

    toggleFavorite(category: string, subtopic: string) {
        const key = `${category}/${subtopic}`;
        if (this.progress.favorites.has(key)) {
            this.progress.favorites.delete(key);
        } else {
            this.progress.favorites.add(key);
        }
        this.saveProgress();
    }

    private updateStreak() {
        const today = new Date().toDateString();
        const lastUpdated = new Date(this.progress.lastUpdated).toDateString();
        
        if (lastUpdated === today) {
            // Same day, no change
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastUpdated === yesterday.toDateString()) {
            this.progress.streak++;
        } else {
            this.progress.streak = 1;
        }
    }

    getDashboardStats(): DashboardStats {
        const categoryStats: { [key: string]: { total: number; completed: number; name: string } } = {
            dsa: { total: 6, completed: 0, name: 'DSA' },
            'system-design': { total: 5, completed: 0, name: 'System Design' },
            'low-level-design': { total: 3, completed: 0, name: 'LLD' },
            'high-level-design': { total: 4, completed: 0, name: 'HLD' },
            'agentic-ai': { total: 3, completed: 0, name: 'Agentic AI' },
            'communication-skills': { total: 3, completed: 0, name: 'Communication Skills' },
            languages: { total: 3, completed: 0, name: 'Languages' }
        };

        let totalCompletedCount = 0;

        this.progress.completed.forEach(item => {
            const parts = item.split('/');
            const category = parts[0];
            if (categoryStats[category]) {
                categoryStats[category].completed++;
                totalCompletedCount++;
            }
        });

        const totalTopics = Object.values(categoryStats).reduce((sum, cat) => sum + cat.total, 0);
        const completedTopics = totalCompletedCount;
        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        const byCategory: { [key: string]: any } = {};
        Object.entries(categoryStats).forEach(([key, value]) => {
            byCategory[key] = {
                name: value.name,
                total: value.total,
                completed: value.completed,
                percentage: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0
            };
        });

        return {
            totalTopics,
            completedTopics,
            completionPercentage,
            streak: this.progress.streak,
            byCategory
        };
    }

    getRecommendedLearningPath() {
        const categories = [
            {
                id: 'dsa',
                name: '📊 DSA Fundamentals',
                description: 'Master data structures and algorithms - the foundation for every interview',
                duration: '2-4 weeks',
                priority: 1
            },
            {
                id: 'low-level-design',
                name: '⚙️ Low-Level Design (LLD)',
                description: 'Design individual components and classes with proper patterns',
                duration: '2-3 weeks',
                priority: 2
            },
            {
                id: 'high-level-design',
                name: '🏛️ High-Level Design (HLD)',
                description: 'Architect large-scale systems and components',
                duration: '2-3 weeks',
                priority: 3
            },
            {
                id: 'system-design',
                name: '🏗️ System Design',
                description: 'Design scalable, distributed systems with real-world constraints',
                duration: '3-5 weeks',
                priority: 4
            },
            {
                id: 'agentic-ai',
                name: '🤖 Agentic AI',
                description: 'Build intelligent agent systems and autonomous applications',
                duration: '2-4 weeks',
                priority: 5
            },
            {
                id: 'communication-skills',
                name: '💬 Communication Skills',
                description: 'Master behavioral interviews and technical communication',
                duration: '1-2 weeks',
                priority: 6
            },
            {
                id: 'languages',
                name: '💻 Languages (Java/Python/JS)',
                description: 'Refresh language-specific syntax and best practices',
                duration: '1-2 weeks',
                priority: 7
            }
        ];

        return {
            recommendedPath: categories,
            totalEstimatedTime: '13-23 weeks',
            tips: [
                'Start with DSA as foundation',
                'Practice LLD and HLD in parallel',
                'System Design comes after solid understanding of lower levels',
                'AI and communication skills can be studied alongside technical topics',
                'Practice daily coding to maintain streak'
            ]
        };
    }

    getFavorites() {
        return Array.from(this.progress.favorites);
    }

    isCompleted(category: string, subtopic: string, language?: string): boolean {
        const key = language ? `${category}/${subtopic}/${language}` : `${category}/${subtopic}`;
        return this.progress.completed.has(key);
    }

    isFavorite(category: string, subtopic: string): boolean {
        const key = `${category}/${subtopic}`;
        return this.progress.favorites.has(key);
    }
}

export const progressService = new ProgressService();
