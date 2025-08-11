import { Footprints, HandHeart, Lightbulb, MessageCircleQuestion, PlusSquare, Save, Slack } from 'lucide-react';
import Link from 'next/link';

const Page = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-bold flex gap-2 items-center">
        <HandHeart /> Welcome!
      </h1>

      <h2 className="text-3x1 font-bold flex gap-2 items-center">
        <Footprints /> First Steps
      </h2>
      <ol className="list-decimal list-inside">
        <li>
          Go to{' '}
          <Link href="/bulk-text" className="text-primary">
            Bulk Text
          </Link>
        </li>
        <li>
          In top right, name your project and click <PlusSquare className="inline h-4 w-4 text-primary" />
        </li>
        <li>Click &quot;Update Table of Contents&quot; to split your markdown into sections</li>
        <li>Click &quot;Run 1st Prompt&quot; to have your first AI model</li>
        <li>Click &quot;Run 2nd Prompt&quot; to run your second AI model against the original content and the first AI results</li>
        <li>
          Click <Save className="inline h-4 w-4 text-primary" /> to remember your changes
        </li>
      </ol>

      <h2 className="text-3x1 font-bold flex gap-2 items-center">
        <Lightbulb /> Purpose
      </h2>
      <p>Allow Aceable staff to prototype different AI pipelines for workflow automation.</p>
      <h2 className="text-1x1 font-bold flex gap-2 items-center">
        <MessageCircleQuestion /> Use this if you need to:
      </h2>
      <ol className="list-decimal list-inside">
        <li>Compare AI quality between multiple vendors and models</li>
        <li>Process large amounts of chunked content in parallel</li>
        <li>Parse text through two phases of different models</li>
        <li>Compare AI Images side-by-side</li>
      </ol>

      <h2 className="text-1x1 font-bold flex gap-2 items-center">
        <MessageCircleQuestion /> Try other tools like:
      </h2>
      <ol className="list-decimal list-inside">
        <li>Google for daily emails and document touchups</li>
        <li>Confluence for searching our knowledge base</li>
        <li>VSCode for coding and learning programming</li>
        <li>Grammarly for fixing typos or minor tone</li>
        <li>
          <a href="https://chatgpt.com/" className="text-primary">
            ChatGPT
          </a>{' '}
          or{' '}
          <a href="https://claude.ai/new" className="text-primary">
            Claude
          </a>{' '}
          for conversations
        </li>
        <li>
          <a href="https://lumalabs.ai/" className="text-primary">
            Luma
          </a>{' '}
          for advanced video editing
        </li>
        <li>
          <a href="https://adobe.com/" className="text-primary">
            Adobe
          </a>{' '}
          for advanced image editing
        </li>
      </ol>
      <p>
        Join{' '}
        <a href="https://aceable.slack.com/archives/C04KPSEJ8EA" className="text-primary">
          <Slack className="inline h-4 w-4" /> #guild-ai
        </a>{' '}
        for help or questions.
      </p>
    </div>
  );
};

export default Page;
