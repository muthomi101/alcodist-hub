import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BLOG_URL } from "../../api";
import {
  ChevronDown,
  Github,
  ExternalLink,
  BookOpen,
  Clock,
  Search,
} from "lucide-react";

const CACHE_KEY = "alcodist_blog_cache";
const FETCH_LIMIT = 50; // Batch size for fetching all pages

const Skeleton = () => (
  <div className="animate-pulse w-full bg-zinc-900 rounded-2xl h-64 border border-zinc-800" />
);

const getReadingTime = (content) => {
  if (!content) return "3 min read";
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / 200); // ~200 words per minute
  return `${time} min read`;
};

// Helper to ensure an array of posts has unique IDs
const getUniquePosts = (postsArray) => {
  if (!Array.isArray(postsArray)) return [];
  return Array.from(
    new Map(postsArray.map((p) => [p?.blog?.id, p])).values()
  ).filter((p) => p?.blog?.id);
};

const BlogCard = ({ post }) => {
  const readers = post?.blog?.readers || 0;
  const author = post?.authorName || "Victor Muthomi";
  const category = post?.blog?.category || "General";
  const readingTime = getReadingTime(post?.blog?.content);

  return (
    <Link
      to={`/blogs/${post?.blog?.id}`}
      className="group flex flex-col bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:bg-zinc-900 transition-all duration-300"
    >
      <div className="h-48 w-full bg-zinc-950 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <img
          src={post?.blog?.image_url}
          alt={post?.blog?.title || "Blog post image"}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {category}
          </span>
          <span className="text-zinc-500 text-[10px] flex items-center gap-1">
            <Clock size={12} /> {readingTime}
          </span>
        </div>
        <h4 className="text-xl font-bold mb-3 leading-tight group-hover:text-emerald-400 transition-colors">
          {post?.blog?.title}
        </h4>

        <div className="mt-auto pt-4 border-t border-zinc-800/80 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
          <span>{author}</span>
          <span>{readers} Readers</span>
        </div>
      </div>
    </Link>
  );
};

export default function RazorBlogsLanding() {
  const [posts, setPosts] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)) || [];
      return getUniquePosts(cached);
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(posts.length === 0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch ALL pages recursively on mount to guarantee global sorting accuracy
  useEffect(() => {
    const fetchAllPages = async () => {
      let allFetched = [];
      let skip = 0;
      let fetching = true;

      try {
        while (fetching) {
          const res = await fetch(
            `${BLOG_URL}?limit=${FETCH_LIMIT}&skip=${skip}`
          );
          const data = await res.json();

          if (Array.isArray(data) && data.length > 0) {
            allFetched = [...allFetched, ...data];
            if (data.length < FETCH_LIMIT) {
              fetching = false;
            } else {
              skip += FETCH_LIMIT;
            }
          } else {
            fetching = false;
          }
        }

        const uniqueData = getUniquePosts(allFetched);
        if (uniqueData.length > 0) {
          setPosts(uniqueData);
          localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueData));
        }
      } catch (err) {
        console.error("Failed to fetch all blog posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPages();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p?.blog?.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [posts]);

  // Global filtering and sorting across the ENTIRE loaded corpus
  const { featured, list } = useMemo(() => {
    if (!posts.length) return { featured: null, list: [] };

    let filtered = posts;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (p) => (p?.blog?.category || "General") === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const titleMatch = p?.blog?.title?.toLowerCase().includes(q);
        const contentMatch = p?.blog?.content?.toLowerCase().includes(q);
        const authorMatch = p?.authorName?.toLowerCase().includes(q);
        const categoryMatch = p?.blog?.category?.toLowerCase().includes(q);
        return titleMatch || contentMatch || authorMatch || categoryMatch;
      });
    }

    // 1. Featured is strictly the latest by creation date
    const sortedByDate = [...filtered].sort(
      (a, b) =>
        new Date(b?.blog?.created_at || 0) - new Date(a?.blog?.created_at || 0)
    );
    const latest = sortedByDate[0] || null;

    // 2. Popular list strictly sorted by number of readers (highest first), with date tie-breaker
    const popular = sortedByDate.slice(latest ? 1 : 0).sort((a, b) => {
      const readersA = a?.blog?.readers || 0;
      const readersB = b?.blog?.readers || 0;
      if (readersB !== readersA) {
        return readersB - readersA; // Highest readers first
      }
      return (
        new Date(b?.blog?.created_at || 0) - new Date(a?.blog?.created_at || 0)
      );
    });

    return { featured: latest, list: popular };
  }, [posts, selectedCategory, searchQuery]);

  const handleViewMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const getSynopsis = (content) => {
    if (!content) return "";
    return content.replace(/[*#_`]/g, "").substring(0, 150) + "...";
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden selection:bg-emerald-500 selection:text-zinc-950">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none" />

      <nav className="max-w-5xl mx-auto px-6 py-6 flex gap-6 justify-end items-center border-b border-zinc-900 relative z-10">
        <Link
          to="/authors/login"
          className="text-[10px] font-bold uppercase text-zinc-500 hover:text-emerald-500 transition-colors"
        >
          Login
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <header className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Alcodist Blogs
          </h1>
        </header>

        {/* Author Bio Section */}
        <section className="mb-16 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <BookOpen size={120} className="text-emerald-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Author & Backend Engineer
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                Victor Muthomi
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Writing in-depth technical blogs, practical Test-Driven
                Development (TDD) workflows, and real-world engineering case
                studies. Exploring backend systems, code architecture, and
                lessons from the trenches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href="https://victormuthomi-omega.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors font-semibold"
              >
                Portfolio <ExternalLink size={14} />
              </a>
              <a
                href="https://github.com/muthomi101"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors font-semibold"
              >
                GitHub <Github size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* Search and Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Featured Hero Banner */}
        <section className="mb-20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-6">
            Featured Story
          </h3>
          {loading ? (
            <Skeleton />
          ) : featured ? (
            <Link
              to={`/blogs/${featured?.blog?.id}`}
              className="group block bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="w-full bg-zinc-950 flex items-center justify-center p-2 overflow-hidden max-h-96">
                <img
                  src={featured?.blog?.image_url}
                  alt={featured?.blog?.title || "Featured blog"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {featured?.blog?.category || "General"}
                  </span>
                  <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                    <Clock size={12} />{" "}
                    {getReadingTime(featured?.blog?.content)}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-4 group-hover:text-emerald-400 transition-colors">
                  {featured?.blog?.title}
                </h2>
                <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                  {getSynopsis(featured?.blog?.content)}
                </p>
                <div className="flex gap-6 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-t border-zinc-800/80 pt-6">
                  <span>{featured?.authorName}</span>
                  <span>
                    {featured?.blog?.created_at
                      ? new Date(featured.blog.created_at).toLocaleDateString()
                      : ""}
                  </span>
                  <span>{featured?.blog?.readers || 0} Readers</span>
                </div>
              </div>
            </Link>
          ) : (
            <p className="text-zinc-500 text-xs italic">
              No stories found matching your filter or search query.
            </p>
          )}
        </section>

        {/* Popular Stories Grid */}
        {list.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-8">
              Popular Stories
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {loading
                ? [1, 2, 3, 4].map((i) => <Skeleton key={i} />)
                : list
                    .slice(0, visibleCount)
                    .map((post) => (
                      <BlogCard key={post?.blog?.id} post={post} />
                    ))}
            </div>

            {visibleCount < list.length && (
              <button
                onClick={handleViewMore}
                className="mt-12 flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest transition-colors hover:text-emerald-400"
              >
                View More <ChevronDown size={14} />
              </button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
