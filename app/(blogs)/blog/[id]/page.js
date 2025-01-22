import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BlogPost({ params }) {
    const { id } = params;
    const postsDirectory = path.join(process.cwd(), 'public', 'Bposts');

    // 1. Check directory existence
    if (!fs.existsSync(postsDirectory)) {
        return renderError("Blog directory not found");
    }

    // 2. Find filename with improved error handling
    const filename = getFileNameFromSlug(id, postsDirectory);
    if (!filename) {
        return renderError("Post not found", id);
    }

    // 3. Read file content safely
    const filePath = path.join(postsDirectory, filename);
    let fileContent;
    try {
        fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error("File read error:", error);
        return renderError("Error loading post", id);
    }

    // 4. Parse frontmatter with fallbacks
    const { data: frontmatter = {}, content = '' } = matter(fileContent);
    
    // 5. Validate required frontmatter
    if (!frontmatter.title) {
        return renderError("Invalid post format", id);
    }

    // 6. Format date safely
    const formattedDate = frontmatter.date ? 
        format(new Date(frontmatter.date), 'MMMM d, yyyy') : 
        'No date specified';

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/blog" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-4xl font-bold">{frontmatter.title}</h1>
            </div>
            <p className="text-sm text-gray-600 mb-4">{formattedDate}</p>
            {frontmatter.description && (
                <p className="text-lg text-gray-800 mb-4">{frontmatter.description}</p>
            )}
<div className='prose prose-lg prose-slate max-w-none'>
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkBreaks]}
    rehypePlugins={[rehypeRaw]}
    components={{
      img: ({ node, ...props }) => (
        <img {...props} className="rounded-lg shadow-lg" alt={props.alt || ''} />
      ),
      a: ({ node, ...props }) => (
        <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
      ),
      code: ({ node, inline, className, children, ...props }) => {
        if (inline) {
          return <code className="bg-gray-100 px-1.5 py-0.5 rounded" {...props}>{children}</code>;
        }
        return <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className={className} {...props}>{children}</code>
        </pre>
      }
    }}
  >
    {content}
  </ReactMarkdown>
</div>
        </div>
    );
}

// Helper function for error rendering
function renderError(message, slug = '') {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/blog" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-4xl font-bold">Error</h1>
            </div>
            <p className="text-red-600">{message}</p>
            {slug && <p className="text-sm text-gray-600 mt-2">Slug: {slug}</p>}
        </div>
    );
}

// Improved filename lookup with debug logging
function getFileNameFromSlug(slug, postsDirectory) {
    try {
        const files = fs.readdirSync(postsDirectory);
        console.debug('Available files:', files); // Debug
        
        const cleanSlug = slug.toLowerCase().replace(/[^\w-]/g, '');
        console.debug('Cleaned slug:', cleanSlug); // Debug

        const match = files.find(file => {
            const base = path.basename(file, '.md');
            const cleanedFile = base.toLowerCase().replace(/[^\w-]/g, '');
            return cleanedFile === cleanSlug;
        });

        console.debug('Matched file:', match); // Debug
        return match || null;
    } catch (error) {
        console.error('Directory read error:', error);
        return null;
    }
}