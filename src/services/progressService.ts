import fs from 'fs';
import path from 'path';
import { contentService, TopicCategory } from './contentService';

interface UserProgress {
    username: string;
    completed: Set<string>;
    favorites: Set<string>;
    streak: number;
    lastUpdated: string;
    createdAt: string;
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

interface ContentCatalog {
    getAllTopics(): TopicCategory[];
}

export class ProgressService {
    private usersDataDir: string;
    private readonly usernamePattern = /^[A-Za-z0-9_-]{1,64}$/;

    constructor(usersDataDir?: string, private readonly contentCatalog: ContentCatalog = contentService) {
        this.usersDataDir = usersDataDir || path.join(process.cwd(), 'data/users');
    }

    initialize() {
        try {
            this.ensureDataDir();
            console.log('✓ Progress service initialized (multi-user)');
        } catch (error) {
            console.error('Error initializing progress service:', error);
        }
    }

    private ensureDataDir() {
        if (!fs.existsSync(this.usersDataDir)) {
            fs.mkdirSync(this.usersDataDir, { recursive: true });
        }
    }

    private getUserProgressPath(username: string): string {
        return path.join(this.getUserDir(username), 'progress.json');
    }

    private getUserDir(username: string): string {
        const safeUsername = this.validateUsername(username);
        const userDir = path.resolve(this.usersDataDir, safeUsername);
        const baseDir = path.resolve(this.usersDataDir);

        if (userDir !== baseDir && !userDir.startsWith(`${baseDir}${path.sep}`)) {
            throw new Error('Invalid username');
        }

        return userDir;
    }

    private validateUsername(username: string): string {
        if (!this.usernamePattern.test(username)) {
            throw new Error('Invalid username');
        }

        return username;
    }

    private getCategoryStats(): { [key: string]: { total: number; completed: number; name: string } } {
        const topics = this.contentCatalog.getAllTopics();

        return topics.reduce((stats, category) => {
            stats[category.id] = {
                total: category.subtopics.length,
                completed: 0,
                name: category.name
            };
            return stats;
        }, {} as { [key: string]: { total: number; completed: number; name: string } });
    }

    private loadProgress(username: string): UserProgress {
        const safeUsername = this.validateUsername(username);

        try {
            const progressFile = this.getUserProgressPath(safeUsername);
            if (fs.existsSync(progressFile)) {
                const data = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
                return {
                    username: safeUsername,
                    completed: new Set(data.completed || []),
                    favorites: new Set(data.favorites || []),
                    streak: data.streak || 0,
                    lastUpdated: data.lastUpdated || new Date().toISOString(),
                    createdAt: data.createdAt || new Date().toISOString()
                };
            }
        } catch (error) {
            console.error(`Error loading progress for ${username}:`, error);
        }

        return {
            username: safeUsername,
            completed: new Set(),
            favorites: new Set(),
            streak: 0,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
    }

    private saveProgress(username: string, progress: UserProgress) {
        const safeUsername = this.validateUsername(username);

        try {
            const userDir = this.getUserDir(safeUsername);
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }

            const progressFile = this.getUserProgressPath(safeUsername);
            const data = {
                username: safeUsername,
                completed: Array.from(progress.completed),
                favorites: Array.from(progress.favorites),
                streak: progress.streak,
                lastUpdated: new Date().toISOString(),
                createdAt: progress.createdAt
            };
            fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error saving progress for ${username}:`, error);
        }
    }

    private updateStreak(progress: UserProgress) {
        const today = new Date().toDateString();
        const lastUpdated = new Date(progress.lastUpdated).toDateString();
        
        if (lastUpdated === today) {
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastUpdated === yesterday.toDateString()) {
            progress.streak++;
        } else {
            progress.streak = 1;
        }
    }

    markAsCompleted(username: string, category: string, subtopic: string, language?: string) {
        const progress = this.loadProgress(username);
        const key = language ? `${category}/${subtopic}/${language}` : `${category}/${subtopic}`;
        progress.completed.add(key);
        this.updateStreak(progress);
        this.saveProgress(username, progress);
    }

    toggleFavorite(username: string, category: string, subtopic: string) {
        const progress = this.loadProgress(username);
        const key = `${category}/${subtopic}`;
        if (progress.favorites.has(key)) {
            progress.favorites.delete(key);
        } else {
            progress.favorites.add(key);
        }
        this.saveProgress(username, progress);
    }


    getDashboardStats(username: string): DashboardStats {
        const progress = this.loadProgress(username);
        const categoryStats = this.getCategoryStats();

        let totalCompletedCount = 0;
        const uniqueCompletedTopics = new Set<string>();

        progress.completed.forEach(item => {
            const parts = item.split('/');
            const category = parts[0];
            const subtopic = parts[1];

            if (!subtopic) {
                return;
            }

            const topicKey = `${category}/${subtopic}`;
            if (uniqueCompletedTopics.has(topicKey)) {
                return;
            }

            uniqueCompletedTopics.add(topicKey);

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
            streak: progress.streak,
            byCategory
        };
    }

    getRecommendedLearningPath(username: string) {
        this.validateUsername(username);
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

    getFavorites(username: string) {
        const progress = this.loadProgress(username);
        return Array.from(progress.favorites);
    }

    isCompleted(username: string, category: string, subtopic: string, language?: string): boolean {
        const progress = this.loadProgress(username);
        const key = language ? `${category}/${subtopic}/${language}` : `${category}/${subtopic}`;
        return progress.completed.has(key);
    }

    isFavorite(username: string, category: string, subtopic: string): boolean {
        const progress = this.loadProgress(username);
        const key = `${category}/${subtopic}`;
        return progress.favorites.has(key);
    }

    getAllUsers(): string[] {
        try {
            if (!fs.existsSync(this.usersDataDir)) {
                return [];
            }
            return fs.readdirSync(this.usersDataDir).filter(file => {
                const stat = fs.statSync(path.join(this.usersDataDir, file));
                return stat.isDirectory();
            });
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    deleteUser(username: string): boolean {
        const safeUsername = this.validateUsername(username);

        try {
            const userDir = this.getUserDir(safeUsername);
            if (fs.existsSync(userDir)) {
                fs.rmSync(userDir, { recursive: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error deleting user ${username}:`, error);
            return false;
        }
    }

    getUserInfo(username: string) {
        const progress = this.loadProgress(username);
        return {
            username,
            createdAt: progress.createdAt,
            lastUpdated: progress.lastUpdated,
            streak: progress.streak,
            totalCompleted: progress.completed.size,
            totalFavorites: progress.favorites.size
        };
    }
}

export const progressService = new ProgressService();
