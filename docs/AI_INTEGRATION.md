# AI Integration Documentation

## Overview

The SEO Content Tool uses @ai/sdk openai GPT-4 to generate comprehensive topic universes based on user personas, problems, and product descriptions. The system is designed with automatic fallback to ensure functionality even without API keys configured.

## Setup

### 1. Configure OpenAI API Key

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

To get an API key:
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API keys section
4. Create a new secret key

### 2. Verify Setup

Run the test script to verify AI integration:

```bash
# Basic test with real estate example
node scripts/test-ai-generation.js

# Interactive test with custom inputs
node scripts/test-ai-generation.js --interactive
```

## How It Works

### Topic Generation Flow

1. **User Input**: Collects persona, problem, and product description
2. **Prompt Engineering**: Constructs detailed prompt for GPT-4
3. **AI Generation**: Sends request to OpenAI API
4. **Response Processing**: Parses and validates AI response
5. **Database Storage**: Saves topics with metadata
6. **Fallback Handling**: Uses mock data if AI fails

### Key Files

- `/src/lib/openai.ts` - OpenAI client configuration
- `/src/lib/prompts.ts` - Prompt templates
- `/src/app/api/universe/generate/route.ts` - Generation endpoint
- `/src/app/api/universe/expand/route.ts` - Expansion endpoint

## Features

### 1. Comprehensive Topic Generation

Generates 50-100 topics organized into 8-12 clusters:
- User journey stages (awareness → retention)
- Search intent classification
- Content depth levels
- Topic relationships

### 2. Smart Clustering

Topics are automatically grouped by:
- Theme similarity
- User journey stage
- Content type
- Problem focus

### 3. Expansion Capabilities

Expand existing universes with:
- Depth expansion (more specific subtopics)
- Breadth expansion (related topics)
- Gap filling (missing angles)

### 4. Error Handling

- **Rate Limiting**: Automatic retry with backoff
- **Timeout Handling**: 30-second timeout with retry
- **API Key Missing**: Falls back to mock data
- **Invalid Response**: Error logging and fallback

## API Endpoints

### Generate Topic Universe

```typescript
POST /api/universe/generate
{
  "projectId": "string",
  "userPersona": "string",
  "problemStatement": "string", 
  "productDescription": "string"
}
```

Response:
```typescript
{
  "message": "Topic universe generated successfully",
  "topics": Topic[],
  "count": number,
  "source": "o3-pro" | "mock"
}
```

### Expand Universe

```typescript
POST /api/universe/expand
{
  "projectId": "string",
  "focusArea": "string"
}
```

## Prompt Structure

The AI receives structured prompts that include:

1. **Context**: User persona, problem, and product
2. **Requirements**: Number of clusters, topics per cluster
3. **Format**: Exact JSON structure expected
4. **Quality Guidelines**: SEO focus, actionability, diversity

Example prompt structure:
```
You are an expert SEO content strategist...

USER PERSONA: [persona]
PROBLEM STATEMENT: [problem]
PRODUCT/SOLUTION: [product]

Create a JSON response with topic clusters...
```

## Topic Metadata

Each generated topic includes:

- **topic**: The main topic title
- **userJourneyStage**: awareness | consideration | decision | retention
- **searchIntent**: informational | commercial | transactional
- **problemStatement**: Specific problem addressed
- **potentialQueries**: Search query variations
- **topicDepth**: beginner | intermediate | advanced
- **contentType**: guide | tutorial | comparison | checklist
- **relationships**: Parent, child, and related topics
- **confidence**: AI confidence score (0-1)

## Monitoring & Debugging

### Check Generation Status

```bash
# View API logs
npm run dev
# Check console for generation logs

# Test without starting server
node scripts/test-ai-generation.js
```

### Common Issues

1. **"OpenAI API key not configured"**
   - Add valid API key to `.env.local`

2. **"Rate limit exceeded"**
   - Wait for retry or upgrade OpenAI plan

3. **"Invalid response format"**
   - Check OpenAI service status
   - Review prompt for clarity

4. **Using mock data unexpectedly**
   - Verify API key is valid
   - Check network connectivity
   - Review error logs

## Cost Considerations

- GPT-4 pricing: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Average generation: ~2K input + 4K output = ~$0.30 per universe
- Expansion: ~1K input + 2K output = ~$0.15 per expansion

## Best Practices

1. **Clear Inputs**: Provide detailed personas and problems
2. **Iterative Refinement**: Use expansion to add depth
3. **Manual Review**: Always review AI-generated topics
4. **Batch Operations**: Generate once, refine as needed
5. **Monitor Usage**: Track API costs in OpenAI dashboard

## Future Enhancements

- [ ] Streaming responses for real-time progress
- [ ] Fine-tuned models for specific industries
- [ ] Semantic deduplication
- [ ] Quality scoring algorithms
- [ ] Multi-language support