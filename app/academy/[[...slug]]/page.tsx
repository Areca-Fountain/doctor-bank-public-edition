import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AcademyArticle from "@/components/academy/AcademyArticle";
import { orderedSlugs, pageBySlug, pages } from "@/lib/academy";

type Props = { params: Promise<{ slug?: string[] }> };

// Build every Academy page ahead of time. An empty slug is /academy itself.
export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug ? [p.slug] : [] }));
}

const slugOf = (parts?: string[]) => (parts && parts.length === 1 ? parts[0] : parts && parts.length > 1 ? "\0" : "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = pageBySlug(slugOf((await params).slug));
  if (!page) return {};
  return {
    title: page.slug ? `${page.title} | Doctor Bank Academy` : "Doctor Bank Academy",
    description: page.description,
  };
}

export default async function AcademyPage({ params }: Props) {
  const slug = slugOf((await params).slug);
  const page = pageBySlug(slug);
  if (!page) notFound();

  // Previous / next follow the order of the left column. Overview, Features and Configuration have none.
  const i = orderedSlugs.indexOf(page.slug);
  const link = (s?: string) => {
    const p = s ? pageBySlug(s) : undefined;
    return p ? { slug: p.slug, title: p.title } : null;
  };
  const prev = i > 0 ? link(orderedSlugs[i - 1]) : null;
  const next = i >= 0 ? link(orderedSlugs[i + 1]) : null;

  return <AcademyArticle page={page} prev={prev} next={next} />;
}
