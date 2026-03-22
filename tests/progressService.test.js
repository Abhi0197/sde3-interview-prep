const fs = require('fs');
const os = require('os');
const path = require('path');

const { ProgressService } = require('../dist/services/progressService');

function createService(contentTopics) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-buddy-progress-'));
    const usersDir = path.join(tempDir, 'users');
    const contentCatalog = {
        getAllTopics: () => contentTopics
    };

    return {
        service: new ProgressService(usersDir, contentCatalog),
        cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true })
    };
}

describe('ProgressService', () => {
    test('deduplicates multi-language completions for the same topic in dashboard stats', () => {
        const { service, cleanup } = createService([
            {
                id: 'languages',
                name: 'Languages',
                icon: 'icon',
                subtopics: [
                    { id: 'java', name: 'Java', category: 'languages', difficulty: 'Beginner', type: 'design' },
                    { id: 'python', name: 'Python', category: 'languages', difficulty: 'Beginner', type: 'design' }
                ]
            }
        ]);

        try {
            service.initialize();
            service.markAsCompleted('alice', 'languages', 'java', 'java');
            service.markAsCompleted('alice', 'languages', 'java', 'python');

            const stats = service.getDashboardStats('alice');

            expect(stats.totalTopics).toBe(2);
            expect(stats.completedTopics).toBe(1);
            expect(stats.byCategory.languages.completed).toBe(1);
            expect(stats.completionPercentage).toBe(50);
        } finally {
            cleanup();
        }
    });

    test('derives category totals from the content catalog instead of hardcoded values', () => {
        const { service, cleanup } = createService([
            {
                id: 'system-design',
                name: 'System Design',
                icon: 'icon',
                subtopics: [
                    { id: 'databases', name: 'Databases', category: 'system-design', difficulty: 'Beginner', type: 'design' },
                    { id: 'caching', name: 'Caching', category: 'system-design', difficulty: 'Beginner', type: 'design' }
                ]
            },
            {
                id: 'frameworks',
                name: 'Frameworks',
                icon: 'icon',
                subtopics: [
                    { id: 'spring-boot', name: 'Spring Boot', category: 'frameworks', difficulty: 'Beginner', type: 'design' }
                ]
            }
        ]);

        try {
            service.initialize();
            service.markAsCompleted('bob', 'frameworks', 'spring-boot');

            const stats = service.getDashboardStats('bob');

            expect(stats.totalTopics).toBe(3);
            expect(stats.completedTopics).toBe(1);
            expect(stats.byCategory['system-design'].total).toBe(2);
            expect(stats.byCategory.frameworks.total).toBe(1);
            expect(stats.byCategory.frameworks.completed).toBe(1);
        } finally {
            cleanup();
        }
    });

    test('rejects usernames with path traversal characters', () => {
        const { service, cleanup } = createService([]);

        try {
            service.initialize();
            expect(() => service.markAsCompleted('../escape', 'dsa', 'arrays')).toThrow('Invalid username');
            expect(() => service.deleteUser('../../tmp')).toThrow('Invalid username');
        } finally {
            cleanup();
        }
    });

    test('tracks study time and surfaces formatted duration in dashboard and topic state', () => {
        const { service, cleanup } = createService([
            {
                id: 'dsa',
                name: 'DSA',
                icon: 'icon',
                subtopics: [
                    { id: 'arrays', name: 'Arrays', category: 'dsa', difficulty: 'Beginner', type: 'algorithm' }
                ]
            }
        ]);

        try {
            service.initialize();
            service.addTimeSpent('alice', 'dsa', 'arrays', 125);

            const dashboard = service.getDashboardStats('alice');
            const topicState = service.getTopicState('alice', 'dsa', 'arrays');

            expect(dashboard.totalDurationSeconds).toBe(125);
            expect(dashboard.totalDuration).toBe('2m');
            expect(topicState.durationSeconds).toBe(125);
            expect(topicState.formattedDuration).toBe('2m');
        } finally {
            cleanup();
        }
    });

    test('records recent activity and continue topic from latest visit', () => {
        const { service, cleanup } = createService([
            {
                id: 'system-design',
                name: 'System Design',
                icon: 'icon',
                subtopics: [
                    { id: 'databases', name: 'Databases', category: 'system-design', difficulty: 'Beginner', type: 'design' },
                    { id: 'caching', name: 'Caching', category: 'system-design', difficulty: 'Beginner', type: 'design' }
                ]
            }
        ]);

        try {
            service.initialize();
            service.recordTopicVisit('bob', 'system-design', 'databases');
            service.addTimeSpent('bob', 'system-design', 'databases', 30);
            service.recordTopicVisit('bob', 'system-design', 'caching');

            const dashboard = service.getDashboardStats('bob');

            expect(dashboard.recentActivity.length).toBe(2);
            expect(dashboard.continueTopic.subtopic).toBe('caching');
            expect(dashboard.recentActivity[1].durationSeconds).toBe(30);
        } finally {
            cleanup();
        }
    });
});
