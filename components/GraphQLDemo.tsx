'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POSTS } from '@/lib/graphql-queries';
import { getTitle, getExcerpt, getFeaturedImageUrl, getCategories, getAuthor } from '@/lib/data-normalization';

interface GraphQLDemoProps {
  category?: string;
  tag?: string;
}

export default function GraphQLDemo({ category, tag }: GraphQLDemoProps) {
  const { data, loading, error } = useQuery(GET_POSTS, {
    variables: {
      first: 5,
      category,
      tag,
    },
    errorPolicy: 'all',
  });

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">GraphQL Demo - Loading...</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-red-600">GraphQL Error</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  const posts = (data as any)?.posts?.edges?.map((edge: any) => edge.node) || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        GraphQL Demo - Latest Posts {category && `(Category: ${category})`} {tag && `(Tag: ${tag})`}
      </h2>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">No posts found.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post: any) => (
            <article key={post.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                <a 
                  href={`/berita/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {getTitle(post)}
                </a>
              </h3>
              
              {getExcerpt(post) && (
                <div 
                  className="text-gray-600 mb-3"
                  dangerouslySetInnerHTML={{ __html: getExcerpt(post) }}
                />
              )}
              
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>
                  {new Date(post.date).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                
                {getAuthor(post) && (
                  <span>By {getAuthor(post)?.name}</span>
                )}
                
                {getCategories(post) && getCategories(post).length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span>Categories:</span>
                    {getCategories(post).map((cat) => (
                      <span key={cat.id} className="text-blue-600">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {post.featuredImage?.node && (
                <div className="mt-4">
                  <img 
                    src={post.featuredImage.node.sourceUrl || getFeaturedImageUrl(post)}
                    alt={post.featuredImage.node.altText || getTitle(post)}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      
      {(data as any)?.posts?.pageInfo?.hasNextPage && (
        <div className="mt-6 text-center">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
}