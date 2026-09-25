import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { loadMultipleCategories, Tier } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>,
    tier: Tier = 'standard',
    /** Questions already answered. A quiz serves what is LEFT in the chosen
     *  topics, so picking a topic you are 6 of 12 through gives you those 6. */
    excludeIds?: Set<string>,
    /** Topics that opted into their extension questions. Topics not listed
     *  serve only their core 12. Undefined serves everything, which is what
     *  review and the dashboard want. */
    extrasTopicIds?: Set<string>
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      const inTopics = all
        .filter(q => selectedTopicIds.has(q.topicId))
        // Questions carry no tier on data assembled before the split, and
        // are then treated as core so nothing silently disappears.
        .filter(q => extrasTopicIds === undefined
          || q.tier !== 'extra'
          || extrasTopicIds.has(q.topicId));
      const fresh = excludeIds && excludeIds.size
        ? inTopics.filter(q => !excludeIds.has(q.id))
        : inTopics;
      // If every question in the selection has been answered, serve the whole
      // selection rather than an empty quiz — the picker greys completed topics
      // out, so reaching this means the reader deliberately chose to redo them.
      setQuestions(shuffle(fresh.length ? fresh : inTopics));
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllQuestions = useCallback(async (categoryIds: string[], tier: Tier = 'standard') => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      setQuestions(all);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, loadQuestions, loadAllQuestions };
}
