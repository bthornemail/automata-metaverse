// WordNet Integration API Routes
import express from 'express';
import WordNetIntegration from '../services/wordnet';

const router = express.Router();
const wordNet = new WordNetIntegration();

// Lookup a single word
router.get('/lookup/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const results = await wordNet.lookupWord(word);
    return res.json({ word, results });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to lookup word', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Semantic analysis for computational topology
router.get('/analyze/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const analysis = await wordNet.analyzeSemanticTopology(word);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Word not found in WordNet' });
    }
    
    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to analyze word', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Batch analysis for multiple words
router.post('/batch-analyze', async (req, res) => {
  try {
    const { words } = req.body;
    
    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Words must be an array' });
    }
    
    const results = await wordNet.analyzeWords(words);
    return res.json({ words, results });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to analyze words', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Find semantic relationships between words
router.get('/relationship/:word1/:word2', async (req, res) => {
  try {
    const { word1, word2 } = req.params;
    const relationships = await wordNet.findSemanticRelationships(word1, word2);
    return res.json({ word1, word2, relationships });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to find relationships', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get topological mapping for a word
router.get('/topology/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const analysis = await wordNet.analyzeSemanticTopology(word);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Word not found in WordNet' });
    }
    
    return res.json({
      word,
      dimension: analysis.topologicalMapping.dimension,
      churchEncoding: analysis.topologicalMapping.churchEncoding,
      pattern: analysis.topologicalMapping.pattern,
      semanticField: analysis.semanticField,
      conceptualDepth: analysis.conceptualDepth
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get topology mapping', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;