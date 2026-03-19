import fs from 'fs';
import path from 'path';

interface ContentModule {
    category: string;
    subtopic: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedTime: string;
    content: string;
    codeExamples?: {
        java?: string;
        python?: string;
        javascript?: string;
    };
    keyPoints?: string[];
}

class ContentService {
    private contentCache: Map<string, ContentModule> = new Map();
    private topics: any[] = [];

    initialize() {
        try {
            this.loadAllContent();
            console.log('✓ Content service initialized');
        } catch (error) {
            console.error('Error initializing content service:', error);
        }
    }

    private loadAllContent() {
        const srcPath = path.join(__dirname, '..');
        const categories = [
            'dsa',
            'system-design',
            'low-level-design',
            'high-level-design',
            'agentic-ai',
            'communication-skills',
            'languages',
            'frameworks'
        ];

        categories.forEach(category => {
            const categoryPath = path.join(srcPath, category);
            if (fs.existsSync(categoryPath)) {
                this.loadCategoryContent(category, categoryPath);
            }
        });
    }

    private loadCategoryContent(category: string, categoryPath: string) {
        try {
            const subtopics = fs.readdirSync(categoryPath);
            const categoryTopics: any = {
                name: this.formatName(category),
                icon: this.getCategoryIcon(category),
                subtopics: []
            };

            subtopics.forEach(subtopic => {
                const subtopicPath = path.join(categoryPath, subtopic);
                const stats = fs.statSync(subtopicPath);
                
                if (stats.isDirectory()) {
                    categoryTopics.subtopics.push({
                        name: this.formatName(subtopic),
                        id: subtopic,
                        category: category,
                        difficulty: this.estimateDifficulty(category, subtopic),
                        type: category === 'dsa' ? 'algorithm' : 'design'
                    });

                    // Cache the content
                    const key = `${category}/${subtopic}`;
                    const content = this.readSubtopicContent(subtopicPath);
                    this.contentCache.set(key, {
                        category,
                        subtopic,
                        title: this.formatName(subtopic),
                        description: this.getDescription(category, subtopic),
                        difficulty: this.estimateDifficulty(category, subtopic),
                        estimatedTime: this.estimateTime(category),
                        content: content,
                        keyPoints: this.extractKeyPoints(content)
                    });
                }
            });

            this.topics.push(categoryTopics);
        } catch (error) {
            console.error(`Error loading category ${category}:`, error);
        }
    }

    private readSubtopicContent(subtopicPath: string): string {
        try {
            const files = fs.readdirSync(subtopicPath);
            let content = '';

            // Try to read markdown files first
            const mdFile = files.find(f => f.endsWith('.md'));
            if (mdFile) {
                content = fs.readFileSync(path.join(subtopicPath, mdFile), 'utf-8');
            } else if (files.length > 0) {
                // Try to read the first file
                content = fs.readFileSync(path.join(subtopicPath, files[0]), 'utf-8');
            }

            return content || 'Content loading...';
        } catch (error) {
            return 'Unable to load content';
        }
    }

    private formatName(name: string): string {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private getCategoryIcon(category: string): string {
        const icons: { [key: string]: string } = {
            dsa: '📊',
            'system-design': '🏗️',
            'low-level-design': '⚙️',
            'high-level-design': '🏛️',
            'agentic-ai': '🤖',
            'communication-skills': '💬',
            languages: '💻'
        };
        return icons[category] || '📚';
    }

    private estimateDifficulty(category: string, subtopic: string): 'Beginner' | 'Intermediate' | 'Advanced' {
        const advancedTopics = ['graphs', 'dynamic-programming', 'system-design', 'scalability', 'microservices'];
        const intermediateTopics = ['trees', 'sorting', 'caching', 'databases', 'design-patterns'];

        for (const topic of advancedTopics) {
            if (subtopic.includes(topic)) return 'Advanced';
        }
        for (const topic of intermediateTopics) {
            if (subtopic.includes(topic)) return 'Intermediate';
        }
        return 'Beginner';
    }

    private estimateTime(category: string): string {
        const times: { [key: string]: string } = {
            dsa: '2-4 weeks',
            'system-design': '3-5 weeks',
            'low-level-design': '2-3 weeks',
            'high-level-design': '2-3 weeks',
            'agentic-ai': '2-4 weeks',
            'communication-skills': '1-2 weeks',
            languages: '1-2 weeks'
        };
        return times[category] || '2 weeks';
    }

    private getDescription(category: string, subtopic: string): string {
        const descriptions: { [key: string]: string } = {
            arrays: 'Master array operations, manipulation, and common algorithms',
            'dynamic-programming': 'Learn optimization techniques using memoization and tabulation',
            graphs: 'Graph traversal, algorithms, and real-world applications',
            'sorting-searching': 'Sorting algorithms, searching techniques, and their complexity analysis',
            strings: 'String manipulation, pattern matching, and algorithms',
            trees: 'Binary trees, BST, balanced trees, and tree traversal',
            caching: 'Caching strategies, LRU, LFU, and distributed caching',
            databases: 'Database design, indexing, ACID properties, and optimization',
            'case-studies': 'Real-world system and application design case studies',
            'microservices': 'Building scalable microservices architecture',
            'scalability': 'Horizontal scaling, load balancing, and performance optimization',
            'design-patterns': 'Common design patterns, creational, structural, and behavioral',
            'oops-principles': 'Object-oriented programming principles and concepts',
            frameworks: 'AI frameworks, tools, and development methodologies',
            fundamentals: 'Core concepts of agentic AI systems',
            projects: 'Practical AI projects and implementations',
            'behavioral-questions': 'Practice behavioral interview questions and answers',
            'mock-interviews': 'Full mock interview sessions and feedback',
            storytelling: 'Crafting effective technical stories and presentations',
            java: 'Java language fundamentals and advanced concepts',
            python: 'Python programming and data science libraries',
            javascript: 'JavaScript, async programming, and web technologies'
        };
        return descriptions[subtopic] || `Learn about ${this.formatName(subtopic)}`;
    }

    private extractKeyPoints(content: string): string[] {
        const points: string[] = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                points.push(line.trim().substring(2));
            }
            if (points.length >= 5) break;
        }
        
        return points.length > 0 ? points : ['Core concepts covered in this section'];
    }

    getAllTopics() {
        return this.topics;
    }

    getContent(category: string, subtopic: string): ContentModule | null {
        const key = `${category}/${subtopic}`;
        return this.contentCache.get(key) || null;
    }

    getByCategory(category: string) {
        return this.topics.find(t => t.name === this.formatName(category)) || null;
    }

    search(query: string): ContentModule[] {
        const results: ContentModule[] = [];
        const lowerQuery = query.toLowerCase();

        this.contentCache.forEach((content, key) => {
            if (
                content.title.toLowerCase().includes(lowerQuery) ||
                content.description.toLowerCase().includes(lowerQuery) ||
                content.content.toLowerCase().includes(lowerQuery)
            ) {
                results.push(content);
            }
        });

        return results;
    }
}

export const contentService = new ContentService();
